import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { timeAgo, truncate, wrapText } from "../../utils/formatting";

describe("timeAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'never' for null", () => {
    expect(timeAgo(null)).toBe("never");
  });

  it("returns 'today' for same day", () => {
    expect(timeAgo("2024-01-15T08:00:00Z")).toBe("today");
  });

  it("returns 'yesterday' for 1 day ago", () => {
    expect(timeAgo("2024-01-14T08:00:00Z")).toBe("yesterday");
  });

  it("returns 'Nd ago' for N days ago", () => {
    expect(timeAgo("2024-01-10T08:00:00Z")).toBe("5d ago");
  });

  it("returns 'Nmo ago' for ~40 days ago", () => {
    expect(timeAgo("2023-12-06T08:00:00Z")).toBe("1mo ago");
  });

  it("returns 'Ny ago' for >365 days ago", () => {
    expect(timeAgo("2022-12-10T08:00:00Z")).toBe("1y ago");
  });
});

describe("truncate", () => {
  it("does not truncate when string is within limit", () => {
    expect(truncate("hi", 10)).toBe("hi");
  });

  it("truncates and appends ellipsis when string exceeds limit", () => {
    expect(truncate("hello world", 5)).toBe("hell…");
  });
});

describe("wrapText", () => {
  it("wraps words to lines within width", () => {
    expect(wrapText("hello world", 5)).toEqual(["hello", "world"]);
  });

  it("returns [''] for empty string", () => {
    expect(wrapText("", 10)).toEqual([""]);
  });

  it("returns original text when width is 0 or negative", () => {
    expect(wrapText("hi", 0)).toEqual(["hi"]);
  });

  it("fits multiple words on same line when they fit", () => {
    expect(wrapText("hi there", 10)).toEqual(["hi there"]);
  });
});
