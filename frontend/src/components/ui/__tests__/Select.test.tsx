import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "../Select";

const options = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
  { value: "c", label: "Option C" },
];

describe("Select", () => {
  it("renders all options", () => {
    render(<Select label="Choose" options={options} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    options.forEach((o) => {
      expect(screen.getByRole("option", { name: o.label })).toBeInTheDocument();
    });
  });

  it("renders placeholder as disabled option", () => {
    render(<Select label="Choose" options={options} placeholder="Select…" />);
    const placeholder = screen.getByRole("option", { name: "Select…" });
    expect(placeholder).toBeDisabled();
  });

  it("fires onChange when selecting", async () => {
    const onChange = vi.fn();
    render(<Select label="Choose" options={options} onChange={onChange} />);
    await userEvent.selectOptions(screen.getByRole("combobox"), "b");
    expect(onChange).toHaveBeenCalled();
  });

  it("associates error with aria-invalid", () => {
    render(<Select label="Choose" options={options} error="Required field" />);
    const select = screen.getByRole("combobox");
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAccessibleDescription("Required field");
  });

  it("marks required with asterisk", () => {
    render(<Select label="Choose" options={options} required />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("is keyboard accessible", async () => {
    render(<Select label="Choose" options={options} />);
    await userEvent.tab();
    expect(screen.getByRole("combobox")).toHaveFocus();
  });
});