import "@testing-library/jest-dom/vitest";
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/svelte";
import SplitDraw from "./SplitDraw.svelte";

afterEach(cleanup);

describe("SplitDraw", () => {
  it("renders player positions for a round of 8", () => {
    const players = [
      "1: Winner: 1", "2: BYE", "3: Runner-up", "4: Winner: 2",
      "5: Winner: 3", "6: Runner-up", "7: BYE", "8: Winner: 4",
    ];
    const { container } = render(SplitDraw, { props: { round: 8, players } });
    expect(container.textContent).toContain("TOP HALF");
    expect(container.textContent).toContain("BOTTOM HALF");
  });

  it("renders with empty players array", () => {
    const { container } = render(SplitDraw, { props: { round: 4, players: [] } });
    expect(container.textContent).toContain("TOP HALF");
  });
});
