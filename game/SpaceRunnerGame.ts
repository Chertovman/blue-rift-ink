import Phaser from "phaser";
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  PLAYER_HEALTH,
  PLAYER_SPEED,
} from "@/game/config";
import type { SpaceRunnerGameHandle, SpaceRunnerGameOptions } from "@/game/types";

type ArcadeSprite = Phaser.Physics.Arcade.Sprite;
type ArcadeGroup = Phaser.Physics.Arcade.Group;
type ArcadePhysicsCallback = Phaser.Types.Physics.Arcade.ArcadePhysicsCallback;
type WeaponId = "pulse" | "twin" | "spread" | "rapid" | "laser";
type PickupKind = "weapon" | "base";
type GamePhase = "shoot" | "dodge";
type TouchControlAction = "up" | "down" | "left" | "right" | "fire" | "pause";
type TouchControlState = Record<Exclude<TouchControlAction, "pause">, boolean>;

type WeaponConfig = {
  id: WeaponId;
  label: string;
  color: number;
  textColor: string;
  cooldown: number;
  rarity: number;
};

const WEAPONS: Record<WeaponId, WeaponConfig> = {
  pulse: {
    id: "pulse",
    label: "Pulse",
    color: 0x67e8f9,
    textColor: "#67e8f9",
    cooldown: 260,
    rarity: 0,
  },
  twin: {
    id: "twin",
    label: "Twin",
    color: 0xbef264,
    textColor: "#bef264",
    cooldown: 240,
    rarity: 54,
  },
  spread: {
    id: "spread",
    label: "Spread",
    color: 0xf0abfc,
    textColor: "#f0abfc",
    cooldown: 330,
    rarity: 28,
  },
  rapid: {
    id: "rapid",
    label: "Rapid",
    color: 0xfacc15,
    textColor: "#facc15",
    cooldown: 120,
    rarity: 9,
  },
  laser: {
    id: "laser",
    label: "Laser",
    color: 0xff4d6d,
    textColor: "#ff8ba7",
    cooldown: 430,
    rarity: 3,
  },
};

const WEB2_EMBLEMS = [
  "emblem-search",
  "emblem-window",
  "emblem-play",
  "emblem-cloud",
  "emblem-bolt",
  "emblem-chip",
  "emblem-cart",
  "emblem-social",
  "emblem-fruit",
];

const SHOOT_PHASE_SECONDS = 35;
const DODGE_PHASE_SECONDS = 18;
const CORRIDOR_DAMAGE_COOLDOWN = 900;
const MIN_CORRIDOR_GAP = 170;

class SpaceRunnerScene extends Phaser.Scene {
  private player!: ArcadeSprite;
  private enemies!: ArcadeGroup;
  private hazards!: ArcadeGroup;
  private bullets!: ArcadeGroup;
  private powerUps!: ArcadeGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<"W" | "A" | "S" | "D", Phaser.Input.Keyboard.Key>;
  private fireKeys!: Record<"SPACE" | "J", Phaser.Input.Keyboard.Key>;
  private pauseKey!: Phaser.Input.Keyboard.Key;
  private touchControls: TouchControlState = {
    up: false,
    down: false,
    left: false,
    right: false,
    fire: false,
  };
  private unbindTouchControls?: () => void;
  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private heartsText!: Phaser.GameObjects.Text;
  private weaponText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private countdownText!: Phaser.GameObjects.Text;
  private instructions!: Phaser.GameObjects.Container;
  private flashOverlay!: Phaser.GameObjects.Rectangle;
  private corridorTopWall!: Phaser.GameObjects.Rectangle;
  private corridorBottomWall!: Phaser.GameObjects.Rectangle;
  private score = 0;
  private health = PLAYER_HEALTH;
  private combo = 0;
  private elapsedSeconds = 0;
  private enemyDelay = 1050;
  private hazardDelay = 960;
  private powerUpDelay = 7600;
  private baseHealDelay = 14500;
  private lastShotAt = 0;
  private weapon: WeaponId = "pulse";
  private weaponExpiresAt = 0;
  private difficultyLevel = 1;
  private phase: GamePhase = "shoot";
  private phaseElapsed = 0;
  private phaseCycle = 1;
  private corridorCenter = GAME_HEIGHT / 2;
  private corridorHalfHeight = 245;
  private corridorTargetCenter = GAME_HEIGHT / 2;
  private corridorNextShiftAt = 0;
  private corridorTopEdge = 55;
  private corridorBottomEdge = GAME_HEIGHT - 55;
  private lastCorridorHitAt = -9999;
  private hasStarted = false;
  private isPaused = false;
  private isOver = false;
  private onGameOver: SpaceRunnerGameOptions["onGameOver"];

  constructor(onGameOver: SpaceRunnerGameOptions["onGameOver"]) {
    super("SpaceRunnerScene");
    this.onGameOver = onGameOver;
  }

  create() {
    this.createTextures();
    this.createStarfield();

    this.player = this.physics.add.sprite(150, GAME_HEIGHT / 2, "ship");
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(5);
    this.player.body?.setSize(50, 28).setOffset(8, 18);

    this.enemies = this.physics.add.group();
    this.hazards = this.physics.add.group();
    this.bullets = this.physics.add.group();
    this.powerUps = this.physics.add.group();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys("W,A,S,D") as Record<
      "W" | "A" | "S" | "D",
      Phaser.Input.Keyboard.Key
    >;
    this.fireKeys = this.input.keyboard!.addKeys("SPACE,J") as Record<
      "SPACE" | "J",
      Phaser.Input.Keyboard.Key
    >;
    this.pauseKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.bindTouchControls();

    this.scoreText = this.addText(28, 24, "SCORE 0000", "#67e8f9");
    this.timerText = this.addText(GAME_WIDTH / 2 - 96, 24, "SURVIVE 00", "#f0abfc");
    this.heartsText = this.addText(GAME_WIDTH - 175, 24, "♥ ♥ ♥", "#ff8ba7");
    this.weaponText = this.addText(28, 62, "WEAPON PULSE", "#ffffff").setFontSize(18);
    this.comboText = this.addText(GAME_WIDTH - 190, 62, "COMBO x1", "#facc15").setFontSize(18);
    this.statusText = this.addText(GAME_WIDTH / 2, GAME_HEIGHT - 34, "READY", "#ffffff")
      .setOrigin(0.5)
      .setFontSize(16);
    this.flashOverlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xff4d6d, 0)
      .setDepth(20);
    this.corridorTopWall = this.add
      .rectangle(GAME_WIDTH / 2, 0, GAME_WIDTH, 1, 0xf0abfc, 0.36)
      .setOrigin(0.5, 0)
      .setDepth(3)
      .setVisible(false);
    this.corridorBottomWall = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT, GAME_WIDTH, 1, 0x67e8f9, 0.32)
      .setOrigin(0.5, 1)
      .setDepth(3)
      .setVisible(false);
    this.instructions = this.createInstructions();

    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, undefined, this);
    this.physics.add.overlap(this.player, this.hazards, this.hitHazard, undefined, this);
    this.physics.add.overlap(this.player, this.powerUps, this.collectPowerUp, undefined, this);
    this.physics.add.overlap(this.bullets, this.enemies, this.shootEnemy, undefined, this);

    this.time.addEvent({
      delay: 1000,
      callback: this.tickTimer,
      callbackScope: this,
      loop: true,
    });
    this.runCountdown();
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
      this.togglePause();
    }

    if (this.isOver || this.isPaused || !this.hasStarted) {
      this.player.setVelocity(0);
      return;
    }

    this.updateWeaponTimer();
    this.movePlayer();

    if (this.phase === "shoot") {
      this.handleFireInput();
    } else {
      this.updateDodgeCorridor();
      this.updateDodgeHazards();
    }

    this.recycleObjects(this.enemies);
    this.recycleObjects(this.hazards);
    this.recycleObjects(this.powerUps);
    this.recycleObjects(this.bullets);
    this.syncBaseLabels();
    this.syncEnemyEmblems();
  }

  private movePlayer() {
    const horizontal =
      Number(this.cursors.right.isDown || this.wasd.D.isDown || this.touchControls.right) -
      Number(this.cursors.left.isDown || this.wasd.A.isDown || this.touchControls.left);
    const vertical =
      Number(this.cursors.down.isDown || this.wasd.S.isDown || this.touchControls.down) -
      Number(this.cursors.up.isDown || this.wasd.W.isDown || this.touchControls.up);

    const movement = new Phaser.Math.Vector2(horizontal, vertical);
    if (movement.lengthSq() > 0) {
      movement.normalize().scale(PLAYER_SPEED);
    }

    this.player.setVelocity(movement.x, movement.y);
    this.player.setAngle(vertical * 7);
  }

  private createTextures() {
    const ship = this.make.graphics({ x: 0, y: 0 }, false);
    ship.fillStyle(0x67e8f9);
    ship.fillTriangle(64, 32, 4, 6, 16, 32);
    ship.fillTriangle(64, 32, 4, 58, 16, 32);
    ship.fillStyle(0xf0abfc);
    ship.fillRect(14, 20, 28, 24);
    ship.fillStyle(0xffffff);
    ship.fillRect(38, 27, 14, 10);
    ship.fillStyle(0xbef264);
    ship.fillRect(0, 25, 12, 14);
    ship.generateTexture("ship", 72, 64);
    ship.destroy();

    const bullet = this.make.graphics({ x: 0, y: 0 }, false);
    bullet.fillStyle(0xffffff);
    bullet.fillRect(0, 4, 24, 6);
    bullet.fillStyle(0x67e8f9);
    bullet.fillRect(8, 1, 20, 12);
    bullet.generateTexture("bullet", 32, 16);
    bullet.destroy();

    const laser = this.make.graphics({ x: 0, y: 0 }, false);
    laser.fillStyle(0xff4d6d);
    laser.fillRect(0, 4, 56, 8);
    laser.fillStyle(0xffffff);
    laser.fillRect(8, 6, 42, 4);
    laser.generateTexture("laser", 60, 16);
    laser.destroy();

    const wall = this.make.graphics({ x: 0, y: 0 }, false);
    wall.fillStyle(0xf0abfc, 0.78);
    wall.fillRect(0, 0, 34, 190);
    wall.fillStyle(0x67e8f9, 0.78);
    wall.fillRect(10, 0, 14, 190);
    wall.lineStyle(3, 0xffffff);
    wall.strokeRect(0, 0, 34, 190);
    wall.generateTexture("hazard-wall", 34, 190);
    wall.destroy();

    const saw = this.make.graphics({ x: 0, y: 0 }, false);
    saw.fillStyle(0xff4d6d);
    for (let i = 0; i < 12; i += 1) {
      const angle = (Math.PI * 2 * i) / 12;
      const nextAngle = (Math.PI * 2 * (i + 0.5)) / 12;
      saw.fillTriangle(
        28 + Math.cos(angle) * 12,
        28 + Math.sin(angle) * 12,
        28 + Math.cos(nextAngle) * 28,
        28 + Math.sin(nextAngle) * 28,
        28 + Math.cos(angle + 0.36) * 12,
        28 + Math.sin(angle + 0.36) * 12,
      );
    }
    saw.fillStyle(0xffffff);
    saw.fillCircle(28, 28, 13);
    saw.fillStyle(0x0f172a);
    saw.fillCircle(28, 28, 6);
    saw.generateTexture("hazard-saw", 56, 56);
    saw.destroy();

    const enemy = this.make.graphics({ x: 0, y: 0 }, false);
    enemy.fillStyle(0xffffff, 0.01);
    enemy.fillCircle(32, 32, 30);
    enemy.generateTexture("enemy", 64, 64);
    enemy.destroy();

    const heavy = this.make.graphics({ x: 0, y: 0 }, false);
    heavy.fillStyle(0xffffff, 0.01);
    heavy.fillCircle(40, 40, 38);
    heavy.generateTexture("heavy-enemy", 80, 80);
    heavy.destroy();

    const power = this.make.graphics({ x: 0, y: 0 }, false);
    power.fillStyle(0xbef264);
    power.fillCircle(22, 22, 20);
    power.fillStyle(0x0f172a);
    power.fillCircle(22, 22, 10);
    power.lineStyle(3, 0xffffff);
    power.strokeCircle(22, 22, 18);
    power.generateTexture("power-up", 44, 44);
    power.destroy();

    const base = this.make.graphics({ x: 0, y: 0 }, false);
    base.fillStyle(0x0052ff);
    base.fillRoundedRect(0, 0, 70, 34, 7);
    base.lineStyle(3, 0x67e8f9);
    base.strokeRoundedRect(0, 0, 70, 34, 7);
    base.generateTexture("base-heal-bg", 70, 34);
    base.destroy();

    this.createEmblemTextures();
  }

  private createStarfield() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x07091a);

    for (let i = 0; i < 130; i += 1) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const size = Phaser.Math.Between(1, 3);
      const color = Phaser.Math.RND.pick([0x67e8f9, 0xf0abfc, 0xffffff, 0xbef264]);
      const star = this.add.rectangle(x, y, size * 2, size, color, 0.72);
      this.tweens.add({
        targets: star,
        x: x - Phaser.Math.Between(80, 230),
        duration: Phaser.Math.Between(2200, 5200),
        repeat: -1,
        yoyo: true,
      });
    }
  }

  private addText(x: number, y: number, text: string, color: string) {
    return this.add.text(x, y, text, {
      color,
      fontFamily: "monospace",
      fontSize: "22px",
      fontStyle: "bold",
      stroke: "#020617",
      strokeThickness: 4,
    });
  }

  private createInstructions() {
    const panel = this.add.rectangle(0, 0, 650, 168, 0x020617, 0.82);
    panel.setStrokeStyle(2, 0x67e8f9, 0.6);
    const title = this.add
      .text(0, -56, "SIDE-SCROLLING SHOOTER", {
        color: "#ffffff",
        fontFamily: "monospace",
        fontSize: "24px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    const controls = this.add
      .text(0, -8, "Move: TOUCH / ARROWS / WASD    Hold FIRE / SPACE / J    Pause: ESC / TAP", {
        color: "#cbd5e1",
        fontFamily: "monospace",
        fontSize: "15px",
      })
      .setOrigin(0.5);
    const mission = this.add
      .text(0, 34, "SHOOT phase: blast emblems. DODGE phase: fly the moving corridor.", {
        color: "#bef264",
        fontFamily: "monospace",
        fontSize: "14px",
      })
      .setOrigin(0.5);

    return this.add
      .container(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 105, [panel, title, controls, mission])
      .setDepth(15);
  }

  private bindTouchControls() {
    const handleControl = (event: Event) => {
      const detail = (event as CustomEvent<{ action?: TouchControlAction; active?: boolean }>).detail;
      const action = detail?.action;

      if (!action) {
        return;
      }

      if (action === "pause") {
        if (detail.active) {
          this.togglePause();
        }
        return;
      }

      this.touchControls[action] = Boolean(detail.active);
    };

    window.addEventListener("space-runner-control", handleControl);

    this.unbindTouchControls = () => {
      window.removeEventListener("space-runner-control", handleControl);
      this.touchControls = {
        up: false,
        down: false,
        left: false,
        right: false,
        fire: false,
      };
    };

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unbindTouchControls?.());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.unbindTouchControls?.());
  }

  private runCountdown() {
    this.countdownText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 35, "3", {
        color: "#ffffff",
        fontFamily: "monospace",
        fontSize: "92px",
        fontStyle: "bold",
        stroke: "#22d3ee",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(16);

    const steps = ["3", "2", "1", "GO"];
    steps.forEach((label, index) => {
      this.time.delayedCall(index * 760, () => {
        this.countdownText.setText(label);
        this.countdownText.setScale(0.72);
        this.countdownText.setAlpha(1);
        this.tweens.add({
          targets: this.countdownText,
          scale: 1.12,
          duration: 240,
          ease: "Back.Out",
          yoyo: true,
        });
      });
    });

    this.time.delayedCall(steps.length * 760, () => {
      this.hasStarted = true;
      this.statusText.setText("RUNNING");
      this.time.delayedCall(220, () => this.spawnEnemy());
      this.time.delayedCall(850, () => this.spawnEnemy());
      this.scheduleNextEnemy();
      this.scheduleNextHazard();
      this.scheduleNextPowerUp();
      this.scheduleNextBaseHeal();
      this.tweens.add({
        targets: [this.countdownText, this.instructions],
        alpha: 0,
        duration: 260,
        onComplete: () => {
          this.countdownText.destroy();
          this.instructions.destroy();
        },
      });
    });
  }

  private scheduleNextEnemy() {
    this.time.delayedCall(this.enemyDelay, () => {
      if (!this.isOver) {
        this.spawnEnemyWave();
        this.scheduleNextEnemy();
      }
    });
  }

  private scheduleNextHazard() {
    this.time.delayedCall(this.hazardDelay, () => {
      if (!this.isOver) {
        this.spawnHazard();
        this.scheduleNextHazard();
      }
    });
  }

  private scheduleNextPowerUp() {
    const variance = Phaser.Math.Between(-900, 1400);
    this.time.delayedCall(Math.max(5200, this.powerUpDelay + variance), () => {
      if (!this.isOver) {
        this.spawnWeaponPowerUp();
        this.scheduleNextPowerUp();
      }
    });
  }

  private scheduleNextBaseHeal() {
    const variance = Phaser.Math.Between(-1800, 2600);
    this.time.delayedCall(Math.max(10000, this.baseHealDelay + variance), () => {
      if (!this.isOver) {
        this.spawnBaseHeal();
        this.scheduleNextBaseHeal();
      }
    });
  }

  private spawnEnemyWave() {
    if (this.isOver || this.isPaused || !this.hasStarted || this.phase !== "shoot") {
      return;
    }

    const waveRoll = Phaser.Math.Between(0, 100);
    const count = this.difficultyLevel >= 4 && waveRoll > 68 ? 3 : this.difficultyLevel >= 2 && waveRoll > 58 ? 2 : 1;
    const baseY = Phaser.Math.Between(90, GAME_HEIGHT - 90);

    for (let i = 0; i < count; i += 1) {
      this.time.delayedCall(i * 160, () => {
        this.spawnEnemy(baseY + (i - 1) * 72);
      });
    }
  }

  private spawnEnemy(forcedY?: number) {
    if (this.isOver || this.isPaused || !this.hasStarted || this.phase !== "shoot") {
      return;
    }

    const isHeavy = this.difficultyLevel >= 3 && Phaser.Math.Between(0, 100) > 74;
    const enemy = this.enemies.create(
      GAME_WIDTH + 70,
      Phaser.Math.Clamp(forcedY ?? Phaser.Math.Between(90, GAME_HEIGHT - 90), 80, GAME_HEIGHT - 80),
      isHeavy ? "heavy-enemy" : "enemy",
    ) as ArcadeSprite;
    const speed = 185 + this.difficultyLevel * 22 + this.elapsedSeconds * 2;
    const drift = Phaser.Math.FloatBetween(-70, 70);
    enemy.setVelocity(-speed, drift);
    enemy.setData("hp", isHeavy ? 3 : this.difficultyLevel >= 5 && Phaser.Math.Between(0, 100) > 70 ? 2 : 1);
    enemy.setData("points", isHeavy ? 85 : 35);
    enemy.setData("wave", Phaser.Math.RND.pick(["straight", "sine"]));
    enemy.body?.setSize(isHeavy ? 58 : 46, isHeavy ? 58 : 46).setOffset(isHeavy ? 11 : 9, isHeavy ? 11 : 9);
    enemy.setDepth(4);
    enemy.setAngularVelocity(isHeavy ? 0 : Phaser.Math.Between(-70, 70));
    this.attachEnemyEmblem(enemy, isHeavy);
  }

  private spawnWeaponPowerUp() {
    if (this.isOver || this.isPaused || !this.hasStarted || this.phase !== "shoot") {
      return;
    }

    const weaponId = this.pickPowerUpWeapon();
    const config = WEAPONS[weaponId];
    const powerUp = this.powerUps.create(GAME_WIDTH + 50, Phaser.Math.Between(95, GAME_HEIGHT - 95), "power-up") as ArcadeSprite;
    powerUp.setVelocity(-(150 + this.difficultyLevel * 12), Phaser.Math.FloatBetween(-22, 22));
    powerUp.setTint(config.color);
    powerUp.setData("kind", "weapon" satisfies PickupKind);
    powerUp.setData("weapon", weaponId);
    powerUp.setDepth(4);
    this.tweens.add({
      targets: powerUp,
      scale: 1.18,
      duration: 420,
      yoyo: true,
      repeat: -1,
    });
  }

  private spawnBaseHeal() {
    if (this.isOver || this.isPaused || !this.hasStarted || this.health >= PLAYER_HEALTH) {
      return;
    }

    const base = this.powerUps.create(GAME_WIDTH + 55, Phaser.Math.Between(105, GAME_HEIGHT - 105), "base-heal-bg") as ArcadeSprite;
    const label = this.add
      .text(base.x, base.y, "ink", {
        color: "#ffffff",
        fontFamily: "monospace",
        fontSize: "15px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(5);
    base.setData("label", label);
    base.setVelocity(-(130 + this.difficultyLevel * 10), Phaser.Math.FloatBetween(-18, 18));
    base.setData("kind", "base" satisfies PickupKind);
    base.setDepth(4);
    this.tweens.add({
      targets: base,
      scale: 1.12,
      duration: 520,
      yoyo: true,
      repeat: -1,
    });
  }

  private spawnHazard() {
    if (this.isOver || this.isPaused || !this.hasStarted || this.phase !== "dodge") {
      return;
    }

    const top = this.corridorTopEdge + 72;
    const bottom = this.corridorBottomEdge - 72;
    const y = bottom > top ? Phaser.Math.Between(Math.ceil(top), Math.floor(bottom)) : GAME_HEIGHT / 2;
    const hazard = this.hazards.create(GAME_WIDTH + 80, y, "hazard-saw") as ArcadeSprite;
    const speed = 230 + this.phaseCycle * 30 + this.difficultyLevel * 15;
    const drift = Phaser.Math.FloatBetween(-78, 78);
    hazard.setVelocity(-speed, drift);
    hazard.setAngularVelocity(Phaser.Math.Between(-260, 260));
    hazard.setDepth(5);
    hazard.setData("points", 24);
    hazard.body?.setCircle(22, 6, 6);
  }

  private pickPowerUpWeapon(): WeaponId {
    const pool = [
      ...Array(WEAPONS.twin.rarity).fill("twin"),
      ...Array(WEAPONS.spread.rarity).fill("spread"),
      ...Array(WEAPONS.rapid.rarity).fill("rapid"),
      ...Array(WEAPONS.laser.rarity).fill("laser"),
    ] as WeaponId[];

    return Phaser.Math.RND.pick(pool);
  }

  private handleFireInput() {
    if (this.fireKeys.SPACE.isDown || this.fireKeys.J.isDown || this.touchControls.fire) {
      this.fireShot();
    }
  }

  private fireShot() {
    const config = WEAPONS[this.weapon];
    const now = this.time.now;
    if (now - this.lastShotAt < config.cooldown) {
      return false;
    }

    this.lastShotAt = now;
    this.fireWeaponPattern(config, 0);
    this.statusText.setText(`${config.label.toUpperCase()} AUTO`);
    return true;
  }

  private fireWeaponPattern(config: WeaponConfig, yOffset: number) {
    if (this.weapon === "spread") {
      [-95, 0, 95].forEach((velocityY) => this.createBullet(this.player.x + 38, this.player.y + yOffset, 470, velocityY, config));
      return;
    }

    if (this.weapon === "twin") {
      this.createBullet(this.player.x + 40, this.player.y + yOffset - 13, 520, 0, config);
      this.createBullet(this.player.x + 40, this.player.y + yOffset + 13, 520, 0, config);
      return;
    }

    if (this.weapon === "rapid") {
      this.createBullet(this.player.x + 42, this.player.y + yOffset, 610, 0, config);
      return;
    }

    if (this.weapon === "laser") {
      this.createBullet(this.player.x + 50, this.player.y + yOffset, 720, 0, config, "laser", 2);
      return;
    }

    this.createBullet(this.player.x + 42, this.player.y + yOffset, 500, 0, config);
  }

  private createBullet(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    weaponConfig: WeaponConfig,
    texture = "bullet",
    damage = 1,
  ) {
    const bullet = this.bullets.create(x, y, texture) as ArcadeSprite;
    bullet.setVelocity(velocityX, velocityY);
    bullet.setTint(weaponConfig.color);
    bullet.setData("damage", damage);
    bullet.setData("weapon", weaponConfig.id);
    bullet.setDepth(6);
  }

  private hitEnemy: ArcadePhysicsCallback = (_player, enemyObject) => {
    const enemy = enemyObject as ArcadeSprite;
    this.removeEnemyEmblem(enemy);
    enemy.disableBody(true, true);
    this.damagePlayer(enemy.x, enemy.y, 0xff4d6d, "-HULL", 260, 0.018);
  };

  private hitHazard: ArcadePhysicsCallback = (_player, hazardObject) => {
    const hazard = hazardObject as ArcadeSprite;
    hazard.disableBody(true, true);
    this.damagePlayer(hazard.x, hazard.y, 0xf0abfc, "-HEART", 300, 0.02);
  };

  private damagePlayer(
    x: number,
    y: number,
    burstColor: number,
    label: string,
    shakeDuration: number,
    shakeIntensity: number,
  ) {
    if (this.isOver) {
      return;
    }

    this.health -= 1;
    this.combo = 0;
    this.updateHud();
    this.cameras.main.shake(shakeDuration, shakeIntensity);
    this.player.setTint(0xff4d6d);
    this.flashOverlay.setAlpha(0.24);
    this.spawnBurst(x, y, burstColor, 18);
    this.floatText(this.player.x, this.player.y - 45, label, "#ff8ba7");
    this.tweens.add({ targets: this.flashOverlay, alpha: 0, duration: 180 });
    this.pulse(this.heartsText, 1.22, 90);
    this.time.delayedCall(190, () => this.player.clearTint());

    if (this.health <= 0) {
      this.finishGame("health");
    }
  }

  private shootEnemy: ArcadePhysicsCallback = (bulletObject, enemyObject) => {
    const bullet = bulletObject as ArcadeSprite;
    const enemy = enemyObject as ArcadeSprite;
    const hp = Number(enemy.getData("hp") ?? 1) - Number(bullet.getData("damage") ?? 1);

    bullet.disableBody(true, true);

    if (hp > 0) {
      enemy.setData("hp", hp);
      enemy.setTint(0xffffff);
      this.time.delayedCall(70, () => enemy.clearTint());
      this.spawnBurst(bullet.x, bullet.y, 0xffffff, 4);
      return;
    }

    this.removeEnemyEmblem(enemy);
    enemy.disableBody(true, true);
    this.combo += 1;
    const multiplier = this.getMultiplier();
    const points = Number(enemy.getData("points") ?? 35) * multiplier;
    this.score += points;
    this.updateHud();
    this.spawnBurst(enemy.x, enemy.y, WEAPONS[this.weapon].color, 14);
    this.floatText(enemy.x, enemy.y - 20, `+${points}`, WEAPONS[this.weapon].textColor);
    this.pulse(this.scoreText, 1.12, 110);
  };

  private collectPowerUp: ArcadePhysicsCallback = (_player, powerObject) => {
    const powerUp = powerObject as ArcadeSprite;
    const kind = powerUp.getData("kind") as PickupKind;
    this.removeBaseLabel(powerUp);
    powerUp.disableBody(true, true);

    if (kind === "base") {
      if (this.health < PLAYER_HEALTH) {
        this.health += 1;
      }
      this.statusText.setText("INK REPAIR +1");
      this.spawnBurst(powerUp.x, powerUp.y, 0x0052ff, 22);
      this.floatText(powerUp.x, powerUp.y - 25, "INK +1", "#67e8f9");
      this.updateHud();
      return;
    }

    const weaponId = powerUp.getData("weapon") as WeaponId;
    const config = WEAPONS[weaponId];
    this.weapon = weaponId;
    this.weaponExpiresAt = this.time.now + (weaponId === "laser" ? 7200 : weaponId === "rapid" ? 9000 : 11000);
    this.statusText.setText(`${config.label.toUpperCase()} ONLINE`);
    this.spawnBurst(powerUp.x, powerUp.y, config.color, weaponId === "laser" || weaponId === "rapid" ? 24 : 16);
    this.floatText(powerUp.x, powerUp.y - 25, config.label.toUpperCase(), config.textColor);
    this.updateHud();
  };

  private tickTimer() {
    if (this.isOver || this.isPaused || !this.hasStarted) {
      return;
    }

    this.elapsedSeconds += 1;
    this.phaseElapsed += 1;
    this.timerText.setText(`SURVIVE ${this.elapsedSeconds.toString().padStart(2, "0")}`);

    if (this.phase === "dodge") {
      this.score += 8 * this.phaseCycle;
      this.updateHud();
    }

    if (this.elapsedSeconds % 10 === 0) {
      this.difficultyLevel += 1;
      this.enemyDelay = Math.max(430, this.enemyDelay - 100);
      this.hazardDelay = Math.max(520, this.hazardDelay - 70);
      this.powerUpDelay = Math.max(5400, this.powerUpDelay - 220);
      this.baseHealDelay = Math.max(11500, this.baseHealDelay - 280);
      this.floatText(GAME_WIDTH / 2, 92, `LEVEL ${this.difficultyLevel}`, "#f0abfc");
      this.cameras.main.shake(120, 0.006);
    }

    if (this.phase === "shoot" && this.phaseElapsed >= SHOOT_PHASE_SECONDS) {
      this.enterDodgePhase();
    } else if (this.phase === "dodge" && this.phaseElapsed >= DODGE_PHASE_SECONDS) {
      this.enterShootPhase();
    }
  }

  private enterDodgePhase() {
    this.phase = "dodge";
    this.phaseElapsed = 0;
    this.statusText.setText("DODGE PHASE - WEAPONS OFFLINE");
    this.statusText.setColor("#f0abfc");
    this.clearGroup(this.enemies);
    this.clearGroup(this.bullets);
    this.corridorCenter = this.player.y;
    this.corridorTargetCenter = this.player.y;
    this.corridorHalfHeight = 245;
    this.corridorNextShiftAt = 0;
    this.lastCorridorHitAt = -9999;
    this.corridorTopWall.setVisible(true);
    this.corridorBottomWall.setVisible(true);
    this.updateDodgeCorridor();
    this.floatText(GAME_WIDTH / 2, GAME_HEIGHT / 2, "DODGE PHASE", "#f0abfc");
    this.cameras.main.shake(180, 0.01);
  }

  private enterShootPhase() {
    this.phase = "shoot";
    this.phaseElapsed = 0;
    this.phaseCycle += 1;
    this.statusText.setText("SHOOT PHASE - WEAPONS ONLINE");
    this.statusText.setColor("#ffffff");
    this.clearGroup(this.hazards);
    this.corridorTopWall.setVisible(false);
    this.corridorBottomWall.setVisible(false);
    this.floatText(GAME_WIDTH / 2, GAME_HEIGHT / 2, `SHOOT PHASE ${this.phaseCycle}`, "#67e8f9");
    this.time.delayedCall(300, () => this.spawnEnemy());
  }

  private updateDodgeCorridor() {
    const now = this.time.now;

    if (now >= this.corridorNextShiftAt) {
      const margin = 170;
      this.corridorTargetCenter = Phaser.Math.Between(margin, GAME_HEIGHT - margin);
      this.corridorNextShiftAt = now + Phaser.Math.Between(1250, 2300);
    }

    const squeeze = Math.sin(now * 0.0024 + this.phaseCycle) * 48;
    const baseHalfHeight = Math.max(150, 255 - this.phaseCycle * 12 - this.difficultyLevel * 4);
    this.corridorCenter = Phaser.Math.Linear(this.corridorCenter, this.corridorTargetCenter, 0.024);
    this.corridorHalfHeight = Phaser.Math.Clamp(baseHalfHeight + squeeze, 122, 270);

    let topEdge = this.corridorCenter - this.corridorHalfHeight;
    let bottomEdge = this.corridorCenter + this.corridorHalfHeight;

    if (topEdge < 48) {
      bottomEdge += 48 - topEdge;
      topEdge = 48;
    }

    if (bottomEdge > GAME_HEIGHT - 48) {
      topEdge -= bottomEdge - (GAME_HEIGHT - 48);
      bottomEdge = GAME_HEIGHT - 48;
    }

    if (bottomEdge - topEdge < MIN_CORRIDOR_GAP) {
      const middle = (topEdge + bottomEdge) / 2;
      topEdge = middle - MIN_CORRIDOR_GAP / 2;
      bottomEdge = middle + MIN_CORRIDOR_GAP / 2;
    }

    this.corridorTopEdge = Phaser.Math.Clamp(topEdge, 40, GAME_HEIGHT - MIN_CORRIDOR_GAP - 40);
    this.corridorBottomEdge = Phaser.Math.Clamp(bottomEdge, this.corridorTopEdge + MIN_CORRIDOR_GAP, GAME_HEIGHT - 40);

    this.corridorTopWall.setDisplaySize(GAME_WIDTH, this.corridorTopEdge);
    this.corridorBottomWall.setDisplaySize(GAME_WIDTH, GAME_HEIGHT - this.corridorBottomEdge);

    const shipPadding = 28;
    const hitTop = this.player.y < this.corridorTopEdge + shipPadding;
    const hitBottom = this.player.y > this.corridorBottomEdge - shipPadding;

    if ((hitTop || hitBottom) && now - this.lastCorridorHitAt > CORRIDOR_DAMAGE_COOLDOWN) {
      this.lastCorridorHitAt = now;
      this.player.setY(
        Phaser.Math.Clamp(this.player.y, this.corridorTopEdge + 42, this.corridorBottomEdge - 42),
      );
      this.damagePlayer(this.player.x, this.player.y, hitTop ? 0xf0abfc : 0x67e8f9, "-WALL", 250, 0.018);
    }
  }

  private updateDodgeHazards() {
    this.hazards.getChildren().forEach((child) => {
      const hazard = child as ArcadeSprite;
      if (!hazard.active) {
        return;
      }

      const body = hazard.body as Phaser.Physics.Arcade.Body | undefined;
      if (!body) {
        return;
      }

      if (hazard.y < this.corridorTopEdge + 48) {
        hazard.setVelocityY(Math.abs(body.velocity.y) + 20);
      } else if (hazard.y > this.corridorBottomEdge - 48) {
        hazard.setVelocityY(-Math.abs(body.velocity.y) - 20);
      }
    });
  }

  private updateWeaponTimer() {
    if (this.weapon === "pulse") {
      return;
    }

    if (this.time.now >= this.weaponExpiresAt) {
      this.weapon = "pulse";
      this.weaponExpiresAt = 0;
      this.statusText.setText("PULSE RESTORED");
      this.updateHud();
      return;
    }

    this.weaponText.setText(`WEAPON ${WEAPONS[this.weapon].label.toUpperCase()} ${Math.ceil((this.weaponExpiresAt - this.time.now) / 1000)}s`);
  }

  private recycleObjects(group: ArcadeGroup) {
    group.getChildren().forEach((child) => {
      const sprite = child as ArcadeSprite;
      if (sprite.active && (sprite.x < -120 || sprite.x > GAME_WIDTH + 160 || sprite.y < -100 || sprite.y > GAME_HEIGHT + 100)) {
        this.removeBaseLabel(sprite);
        this.removeEnemyEmblem(sprite);
        sprite.disableBody(true, true);
      }
    });
  }

  private clearGroup(group: ArcadeGroup) {
    group.getChildren().forEach((child) => {
      const sprite = child as ArcadeSprite;
      this.removeEnemyEmblem(sprite);
      this.removeBaseLabel(sprite);
      sprite.disableBody(true, true);
    });
  }

  private createEmblemTextures() {
    const search = this.make.graphics({ x: 0, y: 0 }, false);
    search.lineStyle(5, 0x67e8f9);
    search.strokeCircle(17, 16, 10);
    search.lineStyle(5, 0xffffff);
    search.lineBetween(25, 24, 34, 33);
    search.generateTexture("emblem-search", 42, 42);
    search.destroy();

    const window = this.make.graphics({ x: 0, y: 0 }, false);
    window.fillStyle(0x67e8f9);
    window.fillRect(7, 7, 12, 12);
    window.fillStyle(0xbef264);
    window.fillRect(23, 7, 12, 12);
    window.fillStyle(0xf0abfc);
    window.fillRect(7, 23, 12, 12);
    window.fillStyle(0xfacc15);
    window.fillRect(23, 23, 12, 12);
    window.generateTexture("emblem-window", 42, 42);
    window.destroy();

    const play = this.make.graphics({ x: 0, y: 0 }, false);
    play.fillStyle(0xff4d6d);
    play.fillTriangle(12, 8, 12, 34, 34, 21);
    play.lineStyle(3, 0xffffff);
    play.strokeTriangle(12, 8, 12, 34, 34, 21);
    play.generateTexture("emblem-play", 42, 42);
    play.destroy();

    const cloud = this.make.graphics({ x: 0, y: 0 }, false);
    cloud.fillStyle(0x67e8f9);
    cloud.fillCircle(15, 23, 9);
    cloud.fillCircle(23, 16, 11);
    cloud.fillCircle(31, 24, 8);
    cloud.fillRect(10, 22, 26, 11);
    cloud.lineStyle(2, 0xffffff);
    cloud.strokeRoundedRect(9, 15, 28, 19, 8);
    cloud.generateTexture("emblem-cloud", 42, 42);
    cloud.destroy();

    const bolt = this.make.graphics({ x: 0, y: 0 }, false);
    bolt.fillStyle(0xfacc15);
    bolt.fillTriangle(24, 4, 11, 24, 22, 22);
    bolt.fillTriangle(18, 20, 31, 18, 16, 38);
    bolt.lineStyle(2, 0xffffff);
    bolt.strokeTriangle(24, 4, 11, 24, 22, 22);
    bolt.generateTexture("emblem-bolt", 42, 42);
    bolt.destroy();

    const chip = this.make.graphics({ x: 0, y: 0 }, false);
    chip.fillStyle(0xbef264);
    chip.fillRect(11, 11, 20, 20);
    chip.lineStyle(2, 0xffffff);
    chip.strokeRect(11, 11, 20, 20);
    chip.fillStyle(0xffffff);
    for (let i = 0; i < 4; i += 1) {
      chip.fillRect(6, 12 + i * 5, 5, 2);
      chip.fillRect(31, 12 + i * 5, 5, 2);
    }
    chip.generateTexture("emblem-chip", 42, 42);
    chip.destroy();

    const cart = this.make.graphics({ x: 0, y: 0 }, false);
    cart.lineStyle(4, 0xf0abfc);
    cart.lineBetween(8, 12, 14, 12);
    cart.lineBetween(14, 12, 18, 27);
    cart.strokeRect(17, 15, 17, 12);
    cart.fillStyle(0xffffff);
    cart.fillCircle(21, 32, 3);
    cart.fillCircle(32, 32, 3);
    cart.generateTexture("emblem-cart", 42, 42);
    cart.destroy();

    const social = this.make.graphics({ x: 0, y: 0 }, false);
    social.lineStyle(4, 0x67e8f9);
    social.strokeCircle(15, 21, 9);
    social.lineStyle(4, 0xf0abfc);
    social.strokeCircle(27, 21, 9);
    social.generateTexture("emblem-social", 42, 42);
    social.destroy();

    const fruit = this.make.graphics({ x: 0, y: 0 }, false);
    fruit.fillStyle(0xff4d6d);
    fruit.fillCircle(21, 23, 12);
    fruit.fillStyle(0xbef264);
    fruit.fillTriangle(21, 11, 31, 7, 27, 17);
    fruit.fillStyle(0xffffff);
    fruit.fillCircle(17, 19, 3);
    fruit.generateTexture("emblem-fruit", 42, 42);
    fruit.destroy();
  }

  private attachEnemyEmblem(enemy: ArcadeSprite, isHeavy: boolean) {
    const emblemKey = Phaser.Math.RND.pick(WEB2_EMBLEMS);
    const emblem = this.add
      .image(enemy.x, enemy.y, emblemKey)
      .setScale(isHeavy ? 1.55 : 1.25)
      .setDepth(5);
    enemy.setData("emblem", emblem);
  }

  private removeEnemyEmblem(sprite: ArcadeSprite) {
    if (sprite.texture.key !== "enemy" && sprite.texture.key !== "heavy-enemy") {
      return;
    }

    const emblem = sprite.getData("emblem") as Phaser.GameObjects.Image | undefined;
    emblem?.destroy();
    sprite.setData("emblem", undefined);
  }

  private removeBaseLabel(sprite: ArcadeSprite) {
    const label = sprite.getData("label") as Phaser.GameObjects.Text | undefined;
    label?.destroy();
    sprite.setData("label", undefined);
  }

  private syncBaseLabels() {
    this.powerUps.getChildren().forEach((child) => {
      const sprite = child as ArcadeSprite;
      const label = sprite.getData("label") as Phaser.GameObjects.Text | undefined;
      if (sprite.active && label?.active) {
        label.setPosition(sprite.x, sprite.y);
      }
    });
  }

  private syncEnemyEmblems() {
    this.enemies.getChildren().forEach((child) => {
      const sprite = child as ArcadeSprite;
      const emblem = sprite.getData("emblem") as Phaser.GameObjects.Image | undefined;
      if (sprite.active && emblem?.active) {
        emblem.setPosition(sprite.x, sprite.y);
      }
    });
  }

  private updateHud() {
    this.scoreText.setText(`SCORE ${this.score.toString().padStart(4, "0")}`);
    this.heartsText.setText(this.renderHearts());
    this.heartsText.setColor(this.health <= 1 ? "#ff4d6d" : "#ff8ba7");
    this.weaponText.setText(`WEAPON ${WEAPONS[this.weapon].label.toUpperCase()}`);
    this.weaponText.setColor(WEAPONS[this.weapon].textColor);
    this.comboText.setText(`${this.phase.toUpperCase()} x${this.getMultiplier()}`);
  }

  private getMultiplier() {
    if (this.combo >= 18) {
      return 4;
    }
    if (this.combo >= 10) {
      return 3;
    }
    if (this.combo >= 5) {
      return 2;
    }
    return 1;
  }

  private renderHearts() {
    const filled = Array.from({ length: Math.max(this.health, 0) }, () => "♥");
    const empty = Array.from({ length: PLAYER_HEALTH - Math.max(this.health, 0) }, () => "♡");
    return [...filled, ...empty].join(" ");
  }

  private pulse(target: Phaser.GameObjects.Components.Transform, scale: number, duration: number) {
    this.tweens.add({
      targets: target,
      scale,
      duration,
      ease: "Sine.Out",
      yoyo: true,
    });
  }

  private floatText(x: number, y: number, label: string, color: string) {
    const text = this.add
      .text(x, y, label, {
        color,
        fontFamily: "monospace",
        fontSize: "18px",
        fontStyle: "bold",
        stroke: "#020617",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(12);

    this.tweens.add({
      targets: text,
      y: y - 34,
      alpha: 0,
      duration: 620,
      ease: "Sine.Out",
      onComplete: () => text.destroy(),
    });
  }

  private spawnBurst(x: number, y: number, color: number, amount: number) {
    for (let i = 0; i < amount; i += 1) {
      const particle = this.add.rectangle(x, y, 5, 4, color, 0.95).setDepth(11);
      this.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-48, 48),
        y: y + Phaser.Math.Between(-48, 48),
        alpha: 0,
        scale: 0.4,
        duration: Phaser.Math.Between(300, 560),
        ease: "Cubic.Out",
        onComplete: () => particle.destroy(),
      });
    }
  }

  private togglePause() {
    if (this.isOver || !this.hasStarted) {
      return;
    }

    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.physics.pause();
      this.tweens.pauseAll();
      this.statusText.setText("PAUSED");
      this.statusText.setColor("#f0abfc");
      this.add
        .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 360, 90, 0x020617, 0.82)
        .setStrokeStyle(2, 0xf0abfc, 0.7)
        .setName("pausePanel")
        .setDepth(18);
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "PAUSED", {
          color: "#ffffff",
          fontFamily: "monospace",
          fontSize: "32px",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setName("pauseText")
        .setDepth(19);
      return;
    }

    this.children.getByName("pausePanel")?.destroy();
    this.children.getByName("pauseText")?.destroy();
    this.physics.resume();
    this.tweens.resumeAll();
    this.statusText.setText("RUNNING");
    this.statusText.setColor("#ffffff");
  }

  private finishGame(reason: "health") {
    if (this.isOver) {
      return;
    }

    this.isOver = true;
    this.physics.pause();
    this.tweens.resumeAll();
    this.statusText.setText("SHIP DESTROYED");
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "GAME OVER", {
        color: "#ffffff",
        fontFamily: "monospace",
        fontSize: "52px",
        fontStyle: "bold",
        stroke: "#fb4dff",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(17);
    this.spawnBurst(this.player.x, this.player.y, 0xff4d6d, 24);

    this.time.delayedCall(450, () => {
      this.onGameOver({
        score: this.score,
        survivedSeconds: this.elapsedSeconds,
        reason,
      });
    });
  }
}

export function createSpaceRunnerGame(options: SpaceRunnerGameOptions): SpaceRunnerGameHandle {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: options.parent,
    backgroundColor: "#07091a",
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: {
        debug: false,
        gravity: { x: 0, y: 0 },
      },
    },
    scene: [new SpaceRunnerScene(options.onGameOver)],
  });

  return {
    destroy: () => {
      game.destroy(true);
    },
  };
}
