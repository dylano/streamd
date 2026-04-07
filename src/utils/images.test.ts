import { describe, it, expect } from "vite-plus/test";
import { getPosterUrl, getBackdropUrl, getStillUrl } from "./images";

describe("getPosterUrl", () => {
  it("returns null for null path", () => {
    expect(getPosterUrl(null)).toBeNull();
  });

  it("returns correct URL with default size", () => {
    expect(getPosterUrl("/abc123.jpg")).toBe("https://image.tmdb.org/t/p/w342/abc123.jpg");
  });

  it("returns correct URL with custom size", () => {
    expect(getPosterUrl("/abc123.jpg", "w92")).toBe("https://image.tmdb.org/t/p/w92/abc123.jpg");
    expect(getPosterUrl("/abc123.jpg", "original")).toBe(
      "https://image.tmdb.org/t/p/original/abc123.jpg",
    );
  });
});

describe("getBackdropUrl", () => {
  it("returns null for null path", () => {
    expect(getBackdropUrl(null)).toBeNull();
  });

  it("returns correct URL with default size", () => {
    expect(getBackdropUrl("/backdrop.jpg")).toBe("https://image.tmdb.org/t/p/w1280/backdrop.jpg");
  });

  it("returns correct URL with custom size", () => {
    expect(getBackdropUrl("/backdrop.jpg", "w300")).toBe(
      "https://image.tmdb.org/t/p/w300/backdrop.jpg",
    );
  });
});

describe("getStillUrl", () => {
  it("returns null for null path", () => {
    expect(getStillUrl(null)).toBeNull();
  });

  it("returns correct URL with default size", () => {
    expect(getStillUrl("/still.jpg")).toBe("https://image.tmdb.org/t/p/w300/still.jpg");
  });

  it("returns correct URL with custom size", () => {
    expect(getStillUrl("/still.jpg", "w92")).toBe("https://image.tmdb.org/t/p/w92/still.jpg");
  });
});
