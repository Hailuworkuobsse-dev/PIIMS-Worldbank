import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectListFilters } from "../ProjectListFilters";
import "@/lib/i18n";

describe("ProjectListFilters", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("fires onChange after debounce on search", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(
      <ProjectListFilters
        q=""
        status={[]}
        sector={[]}
        region=""
        onChange={onChange}
      />,
    );
    const input = screen.getByLabelText(/Search by code or name/i);
    // fireEvent is synchronous — userEvent's async internals deadlock on fake timers
    fireEvent.change(input, { target: { value: "solar" } });
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(onChange).toHaveBeenCalledWith({ q: "solar" });
  });

  it("toggles status chip", async () => {
    const onChange = vi.fn();
    render(
      <ProjectListFilters
        q=""
        status={[]}
        sector={[]}
        region=""
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Active/i }));
    expect(onChange).toHaveBeenCalledWith({ status: "ACTIVE" });
  });

  it("toggles sector chip", async () => {
    const onChange = vi.fn();
    render(
      <ProjectListFilters
        q=""
        status={[]}
        sector={["ENERGY"]}
        region=""
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Energy" }));
    expect(onChange).toHaveBeenCalledWith({ sector: undefined });
  });
});