import { describe, it, expect } from "vitest";
import { countryName } from "./countries";

describe("countryName", () => {
  it("returns a full name for a known ISO3 code", () => {
    expect(countryName("USA")).toBe("United States");
    expect(countryName("GBR")).toBe("United Kingdom");
    expect(countryName("CHN")).toBe("China");
  });

  it("is case-insensitive", () => {
    expect(countryName("usa")).toBe("United States");
    expect(countryName("Gbr")).toBe("United Kingdom");
  });

  it("falls back to the raw ISO code for unknown codes", () => {
    expect(countryName("XYZ")).toBe("XYZ");
    expect(countryName("ZZZ")).toBe("ZZZ");
  });

  it("returns an empty string passthrough for empty input", () => {
    expect(countryName("")).toBe("");
  });

  it("handles multi-word country names correctly", () => {
    expect(countryName("SAU")).toBe("Saudi Arabia");
    expect(countryName("ZAF")).toBe("South Africa");
    expect(countryName("PRK")).toBe("North Korea");
  });

  it("returns the country name for every continent region", () => {
    // Africa
    expect(countryName("NGA")).toBe("Nigeria");
    // Americas
    expect(countryName("BRA")).toBe("Brazil");
    // Asia
    expect(countryName("JPN")).toBe("Japan");
    // Europe
    expect(countryName("DEU")).toBe("Germany");
    // Oceania
    expect(countryName("AUS")).toBe("Australia");
  });
});
