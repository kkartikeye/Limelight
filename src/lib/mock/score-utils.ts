import { mockScores } from "./mock-scores";

const defaultScoreMap = new Map(mockScores.map((s) => [s.code, s]));

export function getCountryScore(code: string): number {
  return defaultScoreMap.get(code)?.score ?? 0;
}
