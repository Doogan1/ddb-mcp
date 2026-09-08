import { describe, it, expect } from "vitest";
import { modeAllows, parseToolMode } from "../../src/config/tool-mode.js";

describe("parseToolMode", () => {
  it("defaults to read", () => {
    expect(parseToolMode(undefined)).toBe("read");
    expect(parseToolMode("")).toBe("read");
    expect(parseToolMode("nope")).toBe("read");
  });

  it("accepts read, session, and builder", () => {
    expect(parseToolMode("read")).toBe("read");
    expect(parseToolMode("SESSION")).toBe("session");
    expect(parseToolMode(" builder ")).toBe("builder");
  });
});

describe("modeAllows", () => {
  it("treats modes as a ladder", () => {
    expect(modeAllows("read", "read")).toBe(true);
    expect(modeAllows("read", "session")).toBe(false);
    expect(modeAllows("session", "read")).toBe(true);
    expect(modeAllows("session", "builder")).toBe(false);
    expect(modeAllows("builder", "session")).toBe(true);
    expect(modeAllows("builder", "builder")).toBe(true);
  });
});
