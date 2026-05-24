import { useMemo } from "react";
import { scaleSequential } from "d3-scale";
import { interpolateYlOrRd } from "d3-scale-chromatic";

export function useColorScale() {
  return useMemo(() => scaleSequential(interpolateYlOrRd).domain([0, 100]), []);
}
