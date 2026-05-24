import type { Feature, FeatureCollection, Geometry } from "geojson";
import { mockScores } from "./mock-scores";
import type { CountryScore } from "@/lib/types/scores";

const defaultScoreMap = new Map(mockScores.map((s) => [s.code, s]));

export function getCountryScore(code: string): number {
  return defaultScoreMap.get(code)?.score ?? 0;
}

export function mergeGeoJsonWithScores(
  geoJson: FeatureCollection<Geometry>,
  scores: CountryScore[] = mockScores
): FeatureCollection<Geometry> {
  const scoreMap = new Map(scores.map((s) => [s.code, s]));

  return {
    ...geoJson,
    features: geoJson.features.map((feature: Feature<Geometry>) => {
      const code = feature.properties?.ISO_A3 as string | undefined;
      const entry = code ? scoreMap.get(code) : undefined;
      return {
        ...feature,
        properties: {
          ...feature.properties,
          score: entry?.score ?? 0,
          articleCount: entry?.articleCount ?? 0,
          topCategory: entry?.topCategory ?? null,
        },
      };
    }),
  };
}
