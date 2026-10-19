import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectListFilters } from "../ProjectListFilters";
import "@/lib/i18n";

describe("ProjectListFilters", () => {
  it("fires onChange after debounce on search", async () => {
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
    const input = screen.getByLabelText(/Search/i);
    await userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime }).type(input, "solar");
    await vi.advanceTimersByTimeAsync(350);
    expect(onChange).toHaveBeenCalledWith({ q: "solar" });
    vi.useRealTimers();
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
    await userEvent.click(screen.getByRole("button", { name: /Energy/i }));
    expect(onChange).toHaveBeenCalledWith({ sector: undefined });
  });
});