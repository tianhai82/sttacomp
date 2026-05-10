import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/svelte";
import Btn from "./Btn.svelte";

afterEach(cleanup);

describe("Btn", () => {
  it("renders with custom class", () => {
    const { getByRole } = render(Btn, { cls: "bg-red-500 text-white" });
    const button = getByRole("button");
    expect(button.className).toContain("bg-red-500");
    expect(button.className).toContain("text-white");
    expect(button.className).toContain("uppercase");
    expect(button.className).toContain("tracking-wide");
  });

  it("fires onclick when clicked", async () => {
    const handler = vi.fn();
    const { getByRole } = render(Btn, { onclick: handler });
    await fireEvent.click(getByRole("button"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not fire onclick when disabled", async () => {
    const handler = vi.fn();
    const { getByRole } = render(Btn, { onclick: handler, disabled: true });
    const button = getByRole("button");
    expect(button).toBeDisabled();
    await fireEvent.click(button);
    expect(handler).not.toHaveBeenCalled();
  });
});
