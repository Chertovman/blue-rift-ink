import * as THREE from "three";
import type { SpaceRunnerGameHandle, SpaceRunnerGameOptions } from "@/game/types";

type TouchControlAction = "up" | "down" | "left" | "right" | "fire" | "pause";
type TouchControlState = Record<Exclude<TouchControlAction, "pause">, boolean>;
type PickupKind = "energy" | "life";

const MAX_HEALTH = 3;
const PLAYER_LIMIT_X = 3.2;
const PLAYER_LIMIT_Y = 2.1;
const PLAYER_SPEED = 5.8;
const TUNNEL_RADIUS = 4.6;
const FAR_Z = -86;
const SPAWN_Z = -78;
const CAMERA_Z = 8;
const COUNTDOWN_SECONDS = 3;
const CUSTOM_MUSIC_SRC = "";

type Obstacle = {
  mesh: THREE.Mesh;
  driftPhase: number;
  driftRadius: number;
  driftSpeed: number;
  radius: number;
  scored: boolean;
};

type Pickup = {
  kind: PickupKind;
  mesh: THREE.Object3D;
  radius: number;
};

export function createEndlessTunnelGame(options: SpaceRunnerGameOptions): SpaceRunnerGameHandle {
  return new EndlessTunnelGame(options);
}

class EndlessTunnelGame implements SpaceRunnerGameHandle {
  private readonly parent: HTMLElement;
  private readonly onGameOver: SpaceRunnerGameOptions["onGameOver"];
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(66, 16 / 9, 0.1, 140);
  private readonly renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  private readonly obstacleGeometry = new THREE.BoxGeometry(1.05, 0.52, 0.3);
  private readonly obstacleMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4d6d,
    emissive: 0x9f1239,
    emissiveIntensity: 1.55,
    metalness: 0.2,
    roughness: 0.34,
  });
  private readonly energyGeometry = new THREE.OctahedronGeometry(0.28);
  private readonly energyMaterial = new THREE.MeshStandardMaterial({
    color: 0xb6ff4d,
    emissive: 0x65a30d,
    metalness: 0.25,
    roughness: 0.25,
  });
  private readonly raycaster = new THREE.Raycaster();
  private readonly mouseTarget = new THREE.Vector2();
  private readonly keys = new Set<string>();
  private readonly touchControls: TouchControlState = {
    up: false,
    down: false,
    left: false,
    right: false,
    fire: false,
  };
  private readonly rings: THREE.Group[] = [];
  private readonly tunnelRails: THREE.Mesh[] = [];
  private readonly baseSigns: THREE.Mesh[] = [];
  private readonly obstacles: Obstacle[] = [];
  private readonly pickups: Pickup[] = [];
  private readonly disposables: Array<{ dispose: () => void }> = [];
  private readonly hud = document.createElement("div");
  private readonly pausePanel = document.createElement("div");
  private readonly countdownPanel = document.createElement("div");
  private lastHudText = "";
  private audioContext?: AudioContext;
  private audioMaster?: GainNode;
  private customMusic?: HTMLAudioElement;
  private customMusicActive = false;
  private customMusicAttempted = false;
  private musicTimer?: number;
  private player!: THREE.Group;
  private playerCore!: THREE.Mesh;
  private previousPlayerX = 0;
  private previousPlayerY = 0;
  private tunnelSteerRoll = 0;
  private animationFrame = 0;
  private musicStep = 0;
  private lastFrameAt = performance.now();
  private score = 0;
  private scoreCarry = 0;
  private energy = 0;
  private health = MAX_HEALTH;
  private elapsed = 0;
  private countdown = COUNTDOWN_SECONDS;
  private speed = 15;
  private spawnTimer = 1.2;
  private pickupTimer = 2.1;
  private invulnerableUntil = 0;
  private isPaused = false;
  private isOver = false;
  private isDestroyed = false;

  constructor(options: SpaceRunnerGameOptions) {
    this.parent = options.parent;
    this.onGameOver = options.onGameOver;
    this.disposables.push(
      this.obstacleGeometry,
      this.obstacleMaterial,
      this.energyGeometry,
      this.energyMaterial,
    );
    this.init();
  }

  destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("space-runner-control", this.handleTouchControl);
    this.renderer.domElement.removeEventListener("pointerdown", this.handlePointer);
    this.renderer.domElement.removeEventListener("pointermove", this.handlePointer);
    this.renderer.domElement.removeEventListener("pointerleave", this.clearMouseTarget);
    this.renderer.domElement.removeEventListener("pointerup", this.clearMouseTarget);
    if (this.musicTimer) {
      window.clearTimeout(this.musicTimer);
    }
    this.customMusic?.pause();
    this.customMusic?.removeAttribute("src");
    this.customMusic?.load();
    void this.audioContext?.close();
    this.hud.remove();
    this.pausePanel.remove();
    this.countdownPanel.remove();
    this.renderer.domElement.remove();
    this.disposables.forEach((item) => item.dispose());
    this.renderer.dispose();
  }

  private init() {
    this.parent.replaceChildren();
    this.parent.classList.remove("pixelated");
    this.parent.style.position = "relative";

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.parent.clientWidth, this.parent.clientHeight, false);
    this.renderer.setClearColor(0x06051a);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.28;
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.height = "100%";
    this.renderer.domElement.style.touchAction = "none";
    this.renderer.domElement.style.width = "100%";
    this.parent.appendChild(this.renderer.domElement);

    this.scene.fog = new THREE.Fog(0x08051f, 16, 104);
    this.camera.position.set(0, 0, CAMERA_Z);
    this.camera.lookAt(0, 0, -24);

    this.addLights();
    this.createTunnel();
    this.createPlayer();
    this.createHud();
    this.resize();

    window.addEventListener("resize", this.handleResize);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("space-runner-control", this.handleTouchControl);
    this.renderer.domElement.addEventListener("pointerdown", this.handlePointer);
    this.renderer.domElement.addEventListener("pointermove", this.handlePointer);
    this.renderer.domElement.addEventListener("pointerleave", this.clearMouseTarget);
    this.renderer.domElement.addEventListener("pointerup", this.clearMouseTarget);

    this.animate();
  }

  private addLights() {
    const ambient = new THREE.AmbientLight(0xb8f7ff, 1.8);
    const key = new THREE.PointLight(0x67e8f9, 42, 58);
    const magenta = new THREE.PointLight(0xfb4dff, 28, 48);
    const lime = new THREE.PointLight(0xb6ff4d, 18, 44);
    key.position.set(-3, 3, 6);
    magenta.position.set(4, -2, -10);
    lime.position.set(0, 3.4, -22);
    this.scene.add(ambient, key, magenta, lime);
  }

  private createTunnel() {
    const ringGeometry = new THREE.TorusGeometry(TUNNEL_RADIUS, 0.035, 10, 128);
    const ringColors = [0x22d3ee, 0xfb4dff, 0xb6ff4d, 0xffd166];
    const ringMaterials = ringColors.map(
      (color, index) =>
        new THREE.MeshBasicMaterial({
          blending: THREE.AdditiveBlending,
          color,
          depthWrite: false,
          transparent: true,
          opacity: [0.92, 0.76, 0.68, 0.62][index],
        }),
    );
    this.disposables.push(ringGeometry, ...ringMaterials);

    for (let index = 0; index < 38; index += 1) {
      const ring = new THREE.Group();
      const halo = new THREE.Mesh(ringGeometry, ringMaterials[index % ringMaterials.length]);
      ring.add(halo);

      for (let spoke = 0; spoke < 8; spoke += 1) {
        const material = ringMaterials[(index + spoke) % ringMaterials.length];
        const geometry = new THREE.BoxGeometry(0.045, 0.045, 1.55);
        const tick = new THREE.Mesh(geometry, material);
        const angle = (Math.PI * 2 * spoke) / 8 + index * 0.08;
        tick.position.set(Math.cos(angle) * TUNNEL_RADIUS, Math.sin(angle) * TUNNEL_RADIUS, 0);
        tick.rotation.z = angle;
        ring.add(tick);
        this.disposables.push(geometry);
      }

      ring.position.z = -index * 2.8;
      ring.rotation.z = index * 0.15;
      ring.userData.phase = index * 0.34;
      this.scene.add(ring);
      this.rings.push(ring);
    }

    const railGeometry = new THREE.BoxGeometry(0.055, 0.055, 24);
    const railMaterials = ringColors.map(
      (color) =>
        new THREE.MeshBasicMaterial({
          blending: THREE.AdditiveBlending,
          color,
          depthWrite: false,
          transparent: true,
          opacity: 0.42,
        }),
    );
    this.disposables.push(railGeometry, ...railMaterials);

    for (let lane = 0; lane < 12; lane += 1) {
      for (let segment = 0; segment < 4; segment += 1) {
        const angle = (Math.PI * 2 * lane) / 12;
        const rail = new THREE.Mesh(railGeometry, railMaterials[(lane + segment) % railMaterials.length]);
        rail.position.set(
          Math.cos(angle) * (TUNNEL_RADIUS - 0.22),
          Math.sin(angle) * (TUNNEL_RADIUS - 0.22),
          -segment * 24 - 9,
        );
        rail.rotation.z = angle;
        rail.userData.angle = angle;
        rail.userData.phase = lane * 0.4 + segment * 0.75;
        this.scene.add(rail);
        this.tunnelRails.push(rail);
      }
    }

    const baseSignTexture = this.createBaseTunnelStripeTexture();
    const baseSignGeometry = new THREE.PlaneGeometry(1.15, 8.2);
    const baseSignMaterial = new THREE.MeshBasicMaterial({
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: baseSignTexture,
      opacity: 0.62,
      side: THREE.DoubleSide,
      transparent: true,
    });
    this.disposables.push(baseSignTexture, baseSignGeometry, baseSignMaterial);

    for (let index = 0; index < 18; index += 1) {
      const sign = new THREE.Mesh(baseSignGeometry, baseSignMaterial);
      const laneOffset = [-1.95, 0, 1.95][index % 3];
      const wallY = -TUNNEL_RADIUS + 0.58 + (index % 2) * 0.28;
      sign.position.set(laneOffset, wallY, -8 - index * 5.6);
      sign.rotation.x = -Math.PI / 2;
      sign.userData.laneOffset = laneOffset;
      sign.userData.phase = index * 0.48;
      sign.userData.wallY = wallY;
      this.scene.add(sign);
      this.baseSigns.push(sign);
    }

    const starGeometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    for (let i = 0; i < 650; i += 1) {
      const radius = THREE.MathUtils.randFloat(5.6, 16);
      const angle = Math.random() * Math.PI * 2;
      positions.push(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        THREE.MathUtils.randFloat(FAR_Z, 8),
      );
    }
    starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xdffbff,
      size: 0.06,
      transparent: true,
      opacity: 0.95,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(stars);
    this.disposables.push(starGeometry, starMaterial);
  }

  private createPlayer() {
    this.player = new THREE.Group();

    const bodyGeometry = new THREE.ConeGeometry(0.36, 1.25, 4);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x67e8f9,
      emissive: 0x0e7490,
      metalness: 0.55,
      roughness: 0.28,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = -Math.PI / 2;

    const wingGeometry = new THREE.BoxGeometry(1.25, 0.08, 0.36);
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0xfb4dff,
      emissive: 0x86198f,
      metalness: 0.35,
      roughness: 0.32,
    });
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.z = 0.22;

    const coreGeometry = new THREE.SphereGeometry(0.17, 16, 16);
    const coreMaterial = new THREE.MeshBasicMaterial({ color: 0xb6ff4d });
    this.playerCore = new THREE.Mesh(coreGeometry, coreMaterial);
    this.playerCore.position.z = 0.62;

    this.player.add(body, wings, this.playerCore);
    this.player.position.set(0, 0, 3.2);
    this.previousPlayerX = this.player.position.x;
    this.previousPlayerY = this.player.position.y;
    this.scene.add(this.player);
    this.disposables.push(
      bodyGeometry,
      bodyMaterial,
      wingGeometry,
      wingMaterial,
      coreGeometry,
      coreMaterial,
    );
  }

  private createHud() {
    this.hud.className =
      "pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3 font-mono text-xs font-black uppercase text-cyan-100 sm:text-sm";
    this.parent.appendChild(this.hud);

    this.pausePanel.className =
      "pointer-events-none absolute inset-0 hidden items-center justify-center bg-slate-950/45 font-mono text-2xl font-black uppercase text-white backdrop-blur-[2px]";
    this.pausePanel.textContent = "Paused";
    this.parent.appendChild(this.pausePanel);

    this.countdownPanel.className =
      "pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/22 font-mono text-6xl font-black uppercase text-cyan-100 backdrop-blur-[1px] sm:text-7xl";
    this.parent.appendChild(this.countdownPanel);
    this.updateHud();
    this.updateCountdownPanel();
  }

  private updateHud() {
    const survivedSeconds = Math.floor(this.elapsed);
    const nextHudText = `
      <div>Score ${this.score.toString().padStart(4, "0")}</div>
      <div class="text-fuchsia-100">Time ${survivedSeconds}s</div>
      <div class="text-lime-100">Hull ${"♥".repeat(this.health)}${"♡".repeat(MAX_HEALTH - this.health)}</div>
    `;

    if (nextHudText !== this.lastHudText) {
      this.hud.innerHTML = nextHudText;
      this.lastHudText = nextHudText;
    }
  }

  private animate = () => {
    this.animationFrame = requestAnimationFrame(this.animate);
    const now = performance.now();
    const delta = Math.min((now - this.lastFrameAt) / 1000, 0.033);
    this.lastFrameAt = now;

    if (!this.isPaused && !this.isOver) {
      this.update(delta);
    }

    this.renderer.render(this.scene, this.camera);
  };

  private update(delta: number) {
    if (this.countdown > 0) {
      this.countdown = Math.max(0, this.countdown - delta);
      this.speed = 12;
      this.moveTunnel(delta * 0.72);
      this.updateCountdownPanel();
      return;
    }

    this.elapsed += delta;
    const isBoosting = this.touchControls.fire || this.keys.has(" ") || this.keys.has("j");
    this.speed = Math.min(38, 15 + this.elapsed * 0.24 + this.energy * 0.07 + (isBoosting ? 6 : 0));
    this.spawnTimer -= delta;
    this.pickupTimer -= delta;

    this.movePlayer(delta);
    this.moveTunnel(delta);
    this.updateObstacles(delta);
    this.updatePickups(delta);

    if (this.spawnTimer <= 0) {
      this.spawnObstacle();
      this.spawnTimer = Math.max(0.42, 1.18 - this.elapsed * 0.01);
    }

    if (this.pickupTimer <= 0) {
      this.spawnPickup();
      this.pickupTimer = THREE.MathUtils.randFloat(1.9, 3.15);
    }

    this.addScore(delta * (22 + this.energy * 0.6 + (isBoosting ? 16 : 0)));
    this.updateHud();
  }

  private addScore(points: number) {
    this.scoreCarry += points;
    const wholePoints = Math.floor(this.scoreCarry);

    if (wholePoints <= 0) {
      return;
    }

    this.score += wholePoints;
    this.scoreCarry -= wholePoints;
  }

  private updateCountdownPanel() {
    if (this.countdown <= 0) {
      this.countdownPanel.style.display = "none";
      return;
    }

    this.countdownPanel.style.display = "flex";
    this.countdownPanel.textContent =
      this.countdown > 0.65 ? Math.ceil(this.countdown).toString() : "GO";
  }

  private movePlayer(delta: number) {
    const previousX = this.previousPlayerX;
    const previousY = this.previousPlayerY;
    const keyboardX =
      Number(this.keys.has("arrowright") || this.keys.has("d")) -
      Number(this.keys.has("arrowleft") || this.keys.has("a"));
    const keyboardY =
      Number(this.keys.has("arrowup") || this.keys.has("w")) -
      Number(this.keys.has("arrowdown") || this.keys.has("s"));
    const touchX = Number(this.touchControls.right) - Number(this.touchControls.left);
    const touchY = Number(this.touchControls.up) - Number(this.touchControls.down);
    const targetX =
      this.mouseTarget.x !== 0 || this.mouseTarget.y !== 0
        ? this.mouseTarget.x * PLAYER_LIMIT_X
        : this.player.position.x + (keyboardX + touchX) * PLAYER_SPEED * delta;
    const targetY =
      this.mouseTarget.x !== 0 || this.mouseTarget.y !== 0
        ? this.mouseTarget.y * PLAYER_LIMIT_Y
        : this.player.position.y + (keyboardY + touchY) * PLAYER_SPEED * delta;

    this.player.position.x = THREE.MathUtils.clamp(targetX, -PLAYER_LIMIT_X, PLAYER_LIMIT_X);
    this.player.position.y = THREE.MathUtils.clamp(targetY, -PLAYER_LIMIT_Y, PLAYER_LIMIT_Y);
    const velocityX = (this.player.position.x - previousX) / Math.max(delta, 0.001);
    const velocityY = (this.player.position.y - previousY) / Math.max(delta, 0.001);
    const normalizedVelocityX = THREE.MathUtils.clamp(velocityX / PLAYER_SPEED, -1, 1);
    const normalizedVelocityY = THREE.MathUtils.clamp(velocityY / PLAYER_SPEED, -1, 1);

    this.player.rotation.z = THREE.MathUtils.lerp(
      this.player.rotation.z,
      -normalizedVelocityX * 0.62 - this.player.position.x * 0.12,
      0.16,
    );
    this.player.rotation.x = THREE.MathUtils.lerp(
      this.player.rotation.x,
      normalizedVelocityY * 0.22 + this.player.position.y * 0.06,
      0.14,
    );
    this.player.rotation.y = THREE.MathUtils.lerp(
      this.player.rotation.y,
      normalizedVelocityX * 0.18,
      0.14,
    );
    this.tunnelSteerRoll = THREE.MathUtils.lerp(
      this.tunnelSteerRoll,
      THREE.MathUtils.clamp(normalizedVelocityX * 0.62 + this.player.position.x * 0.16, -0.9, 0.9),
      0.08,
    );
    const movementPulse = Math.min(0.18, Math.hypot(velocityX, velocityY) * 0.018);
    this.playerCore.scale.setScalar(1 + Math.sin(this.elapsed * 16) * 0.16 + movementPulse);
    this.previousPlayerX = this.player.position.x;
    this.previousPlayerY = this.player.position.y;
  }

  private moveTunnel(delta: number) {
    this.rings.forEach((ring, index) => {
      ring.position.z += this.speed * delta;
      ring.rotation.z += delta * (0.42 + index * 0.006 + this.energy * 0.01 + this.tunnelSteerRoll * 0.36);
      const phase = Number(ring.userData.phase ?? 0);
      const pulse = Math.sin(this.elapsed * 4.2 + phase);
      const wave = Math.sin(this.elapsed * 1.6 + index * 0.28);
      const bend = this.getTunnelBend(ring.position.z, phase);
      ring.position.x = bend.x;
      ring.position.y = bend.y;
      ring.scale.setScalar(1 + pulse * 0.025 + wave * 0.018);
      if (ring.position.z > CAMERA_Z) {
        ring.position.z = FAR_Z;
      }
    });

    this.tunnelRails.forEach((rail) => {
      const phase = Number(rail.userData.phase ?? 0);
      const angle = Number(rail.userData.angle ?? 0) + this.elapsed * 0.18 + this.tunnelSteerRoll * 0.42;
      const radius = TUNNEL_RADIUS - 0.22 + Math.sin(this.elapsed * 2.4 + phase) * 0.12;
      const bend = this.getTunnelBend(rail.position.z, phase);
      rail.position.x = Math.cos(angle) * radius + bend.x;
      rail.position.y = Math.sin(angle) * radius + bend.y;
      rail.position.z += (this.speed * 1.22) * delta;
      rail.rotation.z = angle;
      if (rail.position.z > CAMERA_Z + 12) {
        rail.position.z = FAR_Z - 8;
      }
    });

    this.baseSigns.forEach((sign) => {
      const phase = Number(sign.userData.phase ?? 0);
      const laneOffset = Number(sign.userData.laneOffset ?? 0);
      const wallY = Number(sign.userData.wallY ?? -TUNNEL_RADIUS + 0.58);
      const bend = this.getTunnelBend(sign.position.z, phase);
      sign.position.x = laneOffset + bend.x * 0.78;
      sign.position.y = wallY + bend.y * 0.52;
      sign.position.z += (this.speed * 1.02) * delta;
      sign.rotation.x = -Math.PI / 2;
      sign.rotation.z = Math.sin(this.elapsed * 0.25 + phase) * 0.045 + bend.x * -0.025;
      sign.scale.setScalar(1 + Math.sin(this.elapsed * 1.8 + phase) * 0.025);

      if (sign.position.z > CAMERA_Z + 4) {
        sign.position.z = FAR_Z - 8;
      }
    });

    const cameraBend = this.getTunnelBend(-24, 0);
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, cameraBend.x * 0.28, 0.032);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, cameraBend.y * 0.18, 0.032);
    this.camera.rotation.z = THREE.MathUtils.lerp(
      this.camera.rotation.z,
      Math.sin(this.elapsed * 0.82) * 0.055 + cameraBend.x * -0.035 + this.player.position.x * -0.055 - this.tunnelSteerRoll * 0.18,
      0.07,
    );
  }

  private getTunnelBend(z: number, phase: number) {
    const depth = THREE.MathUtils.clamp(Math.abs(z) / Math.abs(FAR_Z), 0, 1);
    const turnStrength = THREE.MathUtils.smoothstep(depth, 0.04, 0.95);
    const turnTime = this.elapsed * 0.34;
    return {
      x:
        Math.sin(turnTime + depth * 5.7 + phase * 0.1) *
        turnStrength *
        1.55,
      y:
        Math.cos(turnTime * 0.76 + depth * 4.2 + phase * 0.08) *
        turnStrength *
        0.72,
    };
  }

  private spawnObstacle() {
    const gapAngle = Math.random() * Math.PI * 2;
    const pieces = 2 + Math.floor(Math.min(4, this.elapsed / 18));

    for (let i = 0; i < pieces; i += 1) {
      const angle = gapAngle + 0.9 + (Math.PI * 2 * i) / pieces;
      const radius = THREE.MathUtils.randFloat(1.65, 3.35);
      const mesh = new THREE.Mesh(this.obstacleGeometry, this.obstacleMaterial);
      mesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, SPAWN_Z - i * 0.8);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, angle);
      this.scene.add(mesh);
      this.obstacles.push({
        mesh,
        driftPhase: Math.random() * Math.PI * 2,
        driftRadius: THREE.MathUtils.randFloat(0.05, 0.26),
        driftSpeed: THREE.MathUtils.randFloat(0.8, 1.7),
        radius: 0.52,
        scored: false,
      });
    }

    const centerChance = THREE.MathUtils.clamp(0.2 + this.elapsed * 0.012, 0.2, 0.72);

    if (Math.random() < centerChance) {
      const centerMesh = new THREE.Mesh(this.obstacleGeometry, this.obstacleMaterial);
      const centerAngle = Math.random() * Math.PI * 2;
      const centerRadius = THREE.MathUtils.randFloat(0, Math.min(1.1, 0.25 + this.elapsed * 0.018));
      centerMesh.position.set(
        Math.cos(centerAngle) * centerRadius,
        Math.sin(centerAngle) * centerRadius,
        SPAWN_Z - pieces * 0.82,
      );
      centerMesh.scale.set(1.16, 1.16, 1.1);
      centerMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, centerAngle);
      this.scene.add(centerMesh);
      this.obstacles.push({
        mesh: centerMesh,
        driftPhase: Math.random() * Math.PI * 2,
        driftRadius: THREE.MathUtils.randFloat(0.18, 0.46),
        driftSpeed: THREE.MathUtils.randFloat(1.1, 2.2),
        radius: 0.62,
        scored: false,
      });
    }
  }

  private spawnPickup() {
    const shouldSpawnLife = Math.random() < (this.health < MAX_HEALTH ? 0.065 : 0.012);

    if (shouldSpawnLife) {
      this.spawnLifePickup();
      return;
    }

    const angle = Math.random() * Math.PI * 2;
    const radius = THREE.MathUtils.randFloat(0.7, 2.65);
    const mesh = new THREE.Mesh(this.energyGeometry, this.energyMaterial);
    mesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, SPAWN_Z);
    this.scene.add(mesh);
    this.pickups.push({ kind: "energy", mesh, radius: 0.38 });
  }

  private spawnLifePickup() {
    const group = new THREE.Group();
    const badgeGeometry = new THREE.OctahedronGeometry(0.38);
    const badgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x0052ff,
      emissive: 0x0034a3,
      metalness: 0.25,
      roughness: 0.22,
    });
    const badge = new THREE.Mesh(badgeGeometry, badgeMaterial);

    const labelTexture = this.createBaseLabelTexture();
    const labelGeometry = new THREE.PlaneGeometry(1.05, 0.34);
    const labelMaterial = new THREE.MeshBasicMaterial({
      map: labelTexture,
      transparent: true,
      depthWrite: false,
    });
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.z = 0.42;

    group.add(badge, label);
    const angle = Math.random() * Math.PI * 2;
    const radius = THREE.MathUtils.randFloat(0.75, 2.55);
    group.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, SPAWN_Z);
    this.scene.add(group);
    this.pickups.push({ kind: "life", mesh: group, radius: 0.48 });
    this.disposables.push(badgeGeometry, badgeMaterial, labelTexture, labelGeometry, labelMaterial);
  }

  private createBaseTunnelStripeTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 192;
    canvas.height = 1024;
    const context = canvas.getContext("2d");

    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "rgba(0, 82, 255, 0.2)";
      context.fillRect(64, 0, 64, canvas.height);
      context.strokeStyle = "rgba(255, 255, 255, 0.32)";
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(50, 0);
      context.lineTo(50, canvas.height);
      context.moveTo(142, 0);
      context.lineTo(142, canvas.height);
      context.stroke();
      context.font = "900 46px ui-monospace, SFMono-Regular, Menlo, monospace";
      context.textAlign = "center";
      context.textBaseline = "middle";

      for (let y = 92; y < canvas.height; y += 178) {
        context.save();
        context.translate(96, y);
        context.rotate(-Math.PI / 2);
        context.shadowColor = "rgba(0, 82, 255, 0.95)";
        context.shadowBlur = 18;
        context.fillStyle = "#ffffff";
        context.fillText("INK", 0, 0);
        context.restore();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private createBaseLabelTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 96;
    const context = canvas.getContext("2d");

    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "rgba(0, 82, 255, 0.92)";
      context.fillRect(10, 14, 236, 68);
      context.strokeStyle = "rgba(255, 255, 255, 0.95)";
      context.lineWidth = 5;
      context.strokeRect(10, 14, 236, 68);
      context.fillStyle = "#ffffff";
      context.font = "900 44px ui-monospace, SFMono-Regular, Menlo, monospace";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("INK", 128, 49);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private updateObstacles(delta: number) {
    for (let index = this.obstacles.length - 1; index >= 0; index -= 1) {
      const obstacle = this.obstacles[index];
      obstacle.mesh.position.z += this.speed * delta;
      obstacle.mesh.position.x +=
        Math.sin(this.elapsed * obstacle.driftSpeed + obstacle.driftPhase) *
        obstacle.driftRadius *
        delta;
      obstacle.mesh.position.y +=
        Math.cos(this.elapsed * obstacle.driftSpeed * 0.8 + obstacle.driftPhase) *
        obstacle.driftRadius *
        delta;
      obstacle.mesh.rotation.x += delta * 1.7;
      obstacle.mesh.rotation.y += delta * 1.1;

      if (!obstacle.scored && obstacle.mesh.position.z > this.player.position.z) {
        obstacle.scored = true;
        this.score += 45;
      }

      if (this.collides(obstacle.mesh.position, obstacle.radius)) {
        this.scene.remove(obstacle.mesh);
        this.obstacles.splice(index, 1);
        this.damagePlayer();
        continue;
      }

      if (obstacle.mesh.position.z > CAMERA_Z + 3) {
        this.scene.remove(obstacle.mesh);
        this.obstacles.splice(index, 1);
      }
    }
  }

  private updatePickups(delta: number) {
    for (let index = this.pickups.length - 1; index >= 0; index -= 1) {
      const pickup = this.pickups[index];
      pickup.mesh.position.z += this.speed * delta;
      pickup.mesh.rotation.x += delta * 3.2;
      pickup.mesh.rotation.y += delta * 2.4;
      pickup.mesh.scale.setScalar(
        pickup.kind === "life" ? 1 + Math.sin(this.elapsed * 8) * 0.08 : 1,
      );

      if (this.collides(pickup.mesh.position, pickup.radius)) {
        this.scene.remove(pickup.mesh);
        this.pickups.splice(index, 1);
        if (pickup.kind === "life") {
          if (this.health < MAX_HEALTH) {
            this.health += 1;
          }
          this.score += 90;
          this.playLifePickupSound();
        } else {
          this.energy += 1;
          this.score += 130;
          this.playPickupSound();
        }
        continue;
      }

      if (pickup.mesh.position.z > CAMERA_Z + 3) {
        this.scene.remove(pickup.mesh);
        this.pickups.splice(index, 1);
      }
    }
  }

  private collides(position: THREE.Vector3, radius: number) {
    if (Math.abs(position.z - this.player.position.z) > 0.82) {
      return false;
    }

    const dx = position.x - this.player.position.x;
    const dy = position.y - this.player.position.y;
    return Math.sqrt(dx * dx + dy * dy) < radius + 0.42;
  }

  private damagePlayer() {
    if (this.isDestroyed || this.elapsed < this.invulnerableUntil) {
      return;
    }

    this.invulnerableUntil = this.elapsed + 1.15;
    this.health -= 1;
    this.score = Math.max(0, this.score - 180);
    this.playDamageSound();
    this.player.visible = false;
    this.camera.position.x = THREE.MathUtils.randFloatSpread(0.3);
    this.camera.position.y = THREE.MathUtils.randFloatSpread(0.2);
    window.setTimeout(() => {
      if (this.isDestroyed) {
        return;
      }
      this.camera.position.x = 0;
      this.camera.position.y = 0;
    }, 120);
    window.setTimeout(() => {
      if (this.isDestroyed) {
        return;
      }
      this.player.visible = true;
    }, 130);
    window.setTimeout(() => {
      if (this.isDestroyed) {
        return;
      }
      this.player.visible = false;
    }, 250);
    window.setTimeout(() => {
      if (this.isDestroyed) {
        return;
      }
      this.player.visible = true;
    }, 380);

    if (this.health <= 0) {
      this.finishGame();
    }
  }

  private finishGame() {
    if (this.isOver) {
      return;
    }

    this.isOver = true;
    this.isDestroyed = true;
    this.playGameOverSound();
    this.onGameOver({
      score: this.score,
      survivedSeconds: Math.floor(this.elapsed),
      reason: "health",
    });
  }

  private togglePause() {
    if (this.isOver) {
      return;
    }

    this.isPaused = !this.isPaused;
    this.pausePanel.style.display = this.isPaused ? "flex" : "none";
    if (this.customMusicActive && this.customMusic) {
      if (this.isPaused) {
        this.customMusic.pause();
      } else {
        void this.customMusic.play();
      }
    }
    if (this.audioMaster) {
      this.audioMaster.gain.setTargetAtTime(this.isPaused ? 0.018 : 0.055, this.getAudioTime(), 0.08);
    }
  }

  private unlockAudio() {
    if (this.audioContext || this.isOver) {
      void this.audioContext?.resume();
      return;
    }

    const AudioContextConstructor =
      window.AudioContext ??
      (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextConstructor) {
      return;
    }

    const context = new AudioContextConstructor();
    const master = context.createGain();
    const compressor = context.createDynamicsCompressor();
    master.gain.value = 0.055;
    compressor.threshold.value = -18;
    compressor.knee.value = 16;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.006;
    compressor.release.value = 0.16;
    master.connect(compressor);
    compressor.connect(context.destination);

    this.audioContext = context;
    this.audioMaster = master;
    void context.resume();
    this.playTone(880, 0.06, "triangle", 0.025);
    void this.startCustomMusic().then((started) => {
      if (!started) {
        this.scheduleMusic();
      }
    });
  }

  private async startCustomMusic() {
    if (!CUSTOM_MUSIC_SRC || this.customMusicAttempted || this.isOver) {
      return this.customMusicActive;
    }

    this.customMusicAttempted = true;
    const audio = new Audio(CUSTOM_MUSIC_SRC);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.38;
    this.customMusic = audio;

    try {
      await audio.play();
      this.customMusicActive = true;
      return true;
    } catch {
      this.customMusicActive = false;
      audio.removeAttribute("src");
      audio.load();
      return false;
    }
  }

  private scheduleMusic() {
    if (!this.audioContext || !this.audioMaster || this.isOver) {
      return;
    }

    if (!this.isPaused) {
      this.playMusicStep();
    }

    this.musicTimer = window.setTimeout(() => this.scheduleMusic(), 185);
  }

  private playMusicStep() {
    const bassPattern = [55, 55, 82.41, 55, 73.42, 55, 98, 82.41];
    const leadPattern = [220, 277.18, 329.63, 440, 392, 329.63, 277.18, 246.94];
    const step = this.musicStep % 16;

    if (step % 2 === 0) {
      this.playTone(bassPattern[(step / 2) % bassPattern.length], 0.18, "sawtooth", 0.04);
    }

    if (step === 3 || step === 7 || step === 11 || step === 15) {
      this.playTone(leadPattern[step % leadPattern.length], 0.08, "square", 0.018);
    }

    if (this.touchControls.fire || this.keys.has(" ") || this.keys.has("j")) {
      this.playTone(leadPattern[(step + 3) % leadPattern.length] * 2, 0.045, "triangle", 0.012);
    }

    this.musicStep += 1;
  }

  private playPickupSound() {
    this.playTone(659.25, 0.06, "triangle", 0.035);
    window.setTimeout(() => this.playTone(987.77, 0.07, "triangle", 0.028), 45);
  }

  private playLifePickupSound() {
    this.playTone(523.25, 0.08, "triangle", 0.032);
    window.setTimeout(() => this.playTone(783.99, 0.08, "triangle", 0.03), 55);
    window.setTimeout(() => this.playTone(1046.5, 0.1, "triangle", 0.026), 110);
  }

  private playDamageSound() {
    this.playTone(92.5, 0.16, "sawtooth", 0.055);
    window.setTimeout(() => this.playTone(61.74, 0.18, "sawtooth", 0.04), 70);
  }

  private playGameOverSound() {
    this.playTone(220, 0.16, "sawtooth", 0.04);
    window.setTimeout(() => this.playTone(146.83, 0.2, "sawtooth", 0.035), 120);
    window.setTimeout(() => this.playTone(82.41, 0.34, "sawtooth", 0.045), 260);
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    volume: number,
  ) {
    if (!this.audioContext || !this.audioMaster) {
      return;
    }

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.detune.setValueAtTime(Math.sin(this.elapsed * 3) * 4, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0002), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(this.audioMaster);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  private getAudioTime() {
    return this.audioContext?.currentTime ?? 0;
  }

  private resize() {
    const width = Math.max(320, this.parent.clientWidth);
    const height = Math.max(220, this.parent.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private handleResize = () => this.resize();

  private handleKeyDown = (event: KeyboardEvent) => {
    this.unlockAudio();
    const key = event.key.toLowerCase();
    this.keys.add(key);
    if (key === "escape") {
      this.togglePause();
    }
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.key.toLowerCase());
  };

  private handleTouchControl = (event: Event) => {
    const detail = (event as CustomEvent<{ action?: TouchControlAction; active?: boolean }>).detail;
    const action = detail?.action;

    if (!action) {
      return;
    }

    if (detail.active) {
      this.unlockAudio();
    }

    if (action === "pause") {
      if (detail.active) {
        this.togglePause();
      }
      return;
    }

    this.touchControls[action] = Boolean(detail.active);
    if (detail.active) {
      this.clearMouseTarget();
    }
  };

  private handlePointer = (event: PointerEvent) => {
    this.unlockAudio();
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    this.mouseTarget.set(THREE.MathUtils.clamp(x, -1, 1), THREE.MathUtils.clamp(y, -1, 1));
    this.raycaster.setFromCamera(this.mouseTarget, this.camera);
  };

  private clearMouseTarget = () => {
    this.mouseTarget.set(0, 0);
  };
}
