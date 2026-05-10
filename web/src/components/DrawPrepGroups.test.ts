import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/svelte";
import DrawPrepGroups from "./DrawPrepGroups.svelte";

afterEach(cleanup);

function makeGroups(count) {
  return Array.from({ length: count }, () => ({
    winner: { na: "", name: "", position: null },
    hasRunnerUp: true,
    runnerUp: { na: "", name: "", position: null },
  }));
}

describe("DrawPrepGroups", () => {
  it("renders one GroupCard per group", () => {
    const { container } = render(DrawPrepGroups, {
      props: {
        groups: makeGroups(4),
        availableWinnerPositions: [1, 4, 5, 8],
        availableRunnerUpPositionsPerGroup: [[2, 3], [2, 3], [2, 3], [2, 3]],
        onChange: vi.fn(),
        onExport: vi.fn(),
        onImport: vi.fn(),
        onReset: vi.fn(),
      },
    });
    expect(container.textContent).toContain("Group 1");
    expect(container.textContent).toContain("Group 2");
    expect(container.textContent).toContain("Group 3");
    expect(container.textContent).toContain("Group 4");
  });

  it("fires onExport when Export button clicked", async () => {
    const onExport = vi.fn();
    const { getByText } = render(DrawPrepGroups, {
      props: {
        groups: makeGroups(2),
        availableWinnerPositions: [],
        availableRunnerUpPositionsPerGroup: [],
        onChange: vi.fn(),
        onExport,
        onImport: vi.fn(),
        onReset: vi.fn(),
      },
    });
    await fireEvent.click(getByText("Export"));
    expect(onExport).toHaveBeenCalled();
  });

  it("fires onReset when Reset button clicked", async () => {
    const onReset = vi.fn();
    const { getByText } = render(DrawPrepGroups, {
      props: {
        groups: makeGroups(2),
        availableWinnerPositions: [],
        availableRunnerUpPositionsPerGroup: [],
        onChange: vi.fn(),
        onExport: vi.fn(),
        onImport: vi.fn(),
        onReset,
      },
    });
    await fireEvent.click(getByText("Reset"));
    expect(onReset).toHaveBeenCalled();
  });
});
