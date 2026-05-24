export type SpaceRunnerGameOverReason = "health";

export type SpaceRunnerResult = {
  score: number;
  survivedSeconds: number;
  reason: SpaceRunnerGameOverReason;
};

export type SpaceRunnerGameOptions = {
  parent: HTMLElement;
  onGameOver: (result: SpaceRunnerResult) => void;
};

export type SpaceRunnerGameHandle = {
  destroy: () => void;
};
