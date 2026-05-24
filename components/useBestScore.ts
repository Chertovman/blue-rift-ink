"use client";

import { useSyncExternalStore } from "react";

export const BEST_SCORE_KEY = "space-runner-best-score";
const BEST_SCORE_EVENT = "space-runner-best-score-change";

function readBestScoreSnapshot() {
  if (typeof window === "undefined") {
    return 0;
  }

  const storedScore = Number(window.localStorage.getItem(BEST_SCORE_KEY) ?? 0);
  return Number.isFinite(storedScore) ? storedScore : 0;
}

function subscribeToBestScore(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(BEST_SCORE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(BEST_SCORE_EVENT, onStoreChange);
  };
}

export function useBestScore() {
  return useSyncExternalStore(subscribeToBestScore, readBestScoreSnapshot, () => 0);
}

export function readBestScore() {
  return readBestScoreSnapshot();
}

export function writeBestScore(score: number) {
  window.localStorage.setItem(BEST_SCORE_KEY, String(score));
  window.dispatchEvent(new Event(BEST_SCORE_EVENT));
}
