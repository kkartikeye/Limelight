import { describe, it, expect } from "vitest";
import { titleTokens, jaccard, dedupeByTitle } from "./similarity";

describe("titleTokens", () => {
  it("strips punctuation and stopwords", () => {
    const t = titleTokens("Ukraine launches drone strike, says report");
    expect(t).toEqual(new Set(["ukraine", "launches", "drone", "strike"]));
  });
});

describe("jaccard", () => {
  it("returns 1 for identical sets", () => {
    const a = titleTokens("EU approves military aid package");
    expect(jaccard(a, a)).toBe(1);
  });
  it("returns 0 for disjoint sets and empty sets", () => {
    expect(jaccard(new Set(["a1"]), new Set(["b1"]))).toBe(0);
    expect(jaccard(new Set(), new Set(["b1"]))).toBe(0);
  });
});

describe("dedupeByTitle", () => {
  it("drops near-duplicate reprints of an existing title", () => {
    const kept = dedupeByTitle(
      [
        "Ukraine launches drone strike deep inside Russian territory",
        "Completely unrelated economics headline about inflation data",
      ],
      ["Ukraine launches drone strikes deep inside Russian territory - live updates"]
    );
    expect(kept).toEqual([1]);
  });

  it("drops near-duplicates within the same batch, keeping the first", () => {
    const kept = dedupeByTitle(
      [
        "EU approves fresh military aid package for Kyiv",
        "EU approves fresh military aid package for Kyiv, officials say",
        "Wildfire forces evacuations in southern California",
      ],
      []
    );
    expect(kept).toEqual([0, 2]);
  });

  it("keeps genuinely different stories about the same topic", () => {
    const kept = dedupeByTitle(
      ["Zelensky warns of new Russian offensive in Kharkiv region"],
      ["Ukraine launches drone strike deep inside Russian territory"]
    );
    expect(kept).toEqual([0]);
  });
});
