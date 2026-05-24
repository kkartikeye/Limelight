import { useEffect, useState } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import { mergeGeoJsonWithScores } from "@/lib/mock/score-utils";

export function useScores(): FeatureCollection<Geometry> | null {
  const [geoJson, setGeoJson] = useState<FeatureCollection<Geometry> | null>(null);

  useEffect(() => {
    fetch("/data/countries.geojson.json")
      .then((res) => res.json())
      .then((data: FeatureCollection<Geometry>) =>
        setGeoJson(mergeGeoJsonWithScores(data))
      );
  }, []);

  return geoJson;
}
