import { describe, it, expect } from "vitest";
import { relativeTime, relativeTimeSince } from "./time";

describe("relativeTime", () => {
  it("returns '' for an empty string", () => {
    expect(relativeTime("")).toBe("");
  });

  it("returns 'just now' for a timestamp less than 1 minute old", () => {
    const iso = new Date(Date.now() - 30 * 1000).toISOString(); // 30 sec ago
    expect(relativeTime(iso)).toBe("just now");
  });

  it("returns '30m ago' for a timestamp 30 minutes old", () => {
    const iso = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    expect(relativeTime(iso)).toBe("30m ago");
  });

  it("returns '1h ago' for a timestamp exactly 1 hour old", () => {
    const iso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(relativeTime(iso)).toBe("1h ago");
  });

  it("returns '3h ago' for a timestamp 3 hours old", () => {
    const iso = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(iso)).toBe("3h ago");
  });

  it("returns '1d ago' for a timestamp 24 hours old", () => {
    const iso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(iso)).toBe("1d ago");
  });

  it("returns '7d ago' for a timestamp 7 days old", () => {
    const iso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(iso)).toBe("7d ago");
  });
});

describe("relativeTimeSince", () => {
  it("returns 'just now' for a Date within the last minute", () => {
    const d = new Date(Date.now() - 30 * 1000); // 30 seconds ago
    expect(relativeTimeSince(d)).toBe("just now");
  });

  it("returns '1 min ago' for exactly 1 minute", () => {
    const d = new Date(Date.now() - 60 * 1000);
    expect(relativeTimeSince(d)).toBe("1 min ago");
  });

  it("returns '5 min ago' for 5 minutes", () => {
    const d = new Date(Date.now() - 5 * 60 * 1000);
    expect(relativeTimeSince(d)).toBe("5 min ago");
  });

  it("returns '1 hr ago' for exactly 1 hour", () => {
    const d = new Date(Date.now() - 60 * 60 * 1000);
    expect(relativeTimeSince(d)).toBe("1 hr ago");
  });

  it("returns '3 hrs ago' for 3 hours", () => {
    const d = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(relativeTimeSince(d)).toBe("3 hrs ago");
  });
});
