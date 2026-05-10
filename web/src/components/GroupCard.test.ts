import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/svelte";
import GroupCard from "./GroupCard.svelte";

afterEach(cleanup);

function makeGroup(overrides = {}) {
  return {
    winner: { na: "", name: "", position: null },
    hasRunnerUp: true,
    runnerUp: { na: "", name: "", position: null },
    ...overrides,
  };
}

describe("GroupCard", () => {
  it("renders group index", () => {
    const { container } = render(GroupCard, {
      props: {
        group: makeGroup(),
        groupIndex: 3,
        availableWinnerPositions: [1, 4, 5, 8],
        availableRunnerUpPositions: [2, 3, 6, 7],
        onUpdate: vi.fn(),
      },
    });
    expect(container.textContent).toContain("Group 3");
  });

  it("shows available winner positions in dropdown", () => {
    const { container } = render(GroupCard, {
      props: {
        group: makeGroup(),
        groupIndex: 1,
        availableWinnerPositions: [1, 4, 5, 8],
        availableRunnerUpPositions: [2, 3],
        onUpdate: vi.fn(),
      },
    });
    const select = container.querySelectorAll("select")[0];
    const options = Array.from(select.options).map(o => o.value);
    expect(options).toContain("1");
    expect(options).toContain("4");
    expect(options).toContain("5");
    expect(options).toContain("8");
  });

  it("calls onUpdate when winner name is entered", async () => {
    const onUpdate = vi.fn();
    const { container } = render(GroupCard, {
      props: {
        group: makeGroup(),
        groupIndex: 1,
        availableWinnerPositions: [],
        availableRunnerUpPositions: [],
        onUpdate,
      },
    });
    const inputs = container.querySelectorAll("input[type='text']");
    const nameInput = inputs[1]; // second text input is winner name
    await fireEvent.input(nameInput, { target: { value: "Player A" } });
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        groupIndex: 0,
        field: "winner",
        value: expect.objectContaining({ name: "Player A" }),
      })
    );
  });

  it("hides runner-up row when hasRunnerUp is false", () => {
    const { container } = render(GroupCard, {
      props: {
        group: makeGroup({ hasRunnerUp: false, runnerUp: null }),
        groupIndex: 1,
        availableWinnerPositions: [],
        availableRunnerUpPositions: [],
        onUpdate: vi.fn(),
      },
    });
    const spans = container.querySelectorAll("span");
    const runnerUpLabels = Array.from(spans).filter(s => s.textContent === "Runner-up");
    expect(runnerUpLabels.length).toBe(0);
  });

  it("shows runner-up row when hasRunnerUp is true", () => {
    const { container } = render(GroupCard, {
      props: {
        group: makeGroup({ hasRunnerUp: true, runnerUp: { na: "", name: "", position: null } }),
        groupIndex: 1,
        availableWinnerPositions: [],
        availableRunnerUpPositions: [3],
        onUpdate: vi.fn(),
      },
    });
    const spans = container.querySelectorAll("span");
    const runnerUpLabels = Array.from(spans).filter(s => s.textContent === "Runner-up");
    expect(runnerUpLabels.length).toBeGreaterThan(0);
  });
});
