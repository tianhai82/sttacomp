import { describe, it, expect, vi } from "vitest";
import { formatExportFilename } from "./exportFilename";

describe("formatExportFilename", () => {
  it("includes event name and local datetime", () => {
    // Freeze time to 2026-05-09 14:30 local
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T14:30:00"));
    const result = formatExportFilename("U13 Boys Singles");
    expect(result).toBe("draw-U13 Boys Singles-2026-05-09 14-30.json");
    vi.useRealTimers();
  });

  it("omits event name dash when empty", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T14:30:00"));
    const result = formatExportFilename("");
    expect(result).toBe("draw-2026-05-09 14-30.json");
    vi.useRealTimers();
  });

  it("sanitizes special characters in event name", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T14:30:00"));
    const result = formatExportFilename('Open/Doubles "Final"');
    expect(result).toMatch(/^draw-.*\.json$/);
    expect(result).not.toContain("/");
    expect(result).not.toContain('"');
    vi.useRealTimers();
  });

  it("collapses multiple spaces in event name", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T14:30:00"));
    const result = formatExportFilename("U13   Boys   Singles");
    expect(result).not.toContain("   ");
    vi.useRealTimers();
  });

  it("pads single-digit hours and minutes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-05T09:05:00"));
    const result = formatExportFilename("Test");
    expect(result).toContain("09-05");
    vi.useRealTimers();
  });
});
