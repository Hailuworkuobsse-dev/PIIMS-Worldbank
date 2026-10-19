import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "../Input";

describe("Input", () => {
  it("renders with label", () => {
    render(<Input label="Full name" />);
    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
  });

  it("marks required with asterisk", () => {
    render(<Input label="Email" required />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("associates hint text", () => {
    render(<Input label="Phone" hint="Include country code" />);
    const input = screen.getByLabelText("Phone");
    expect(input).toHaveAccessibleDescription("Include country code");
  });

  it("associates error message with aria-invalid", () => {
    render(<Input label="Email" error="Invalid email" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Invalid email");
  });

  it("fires onChange", async () => {
    const onChange = vi.fn();
    render(<Input label="Name" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText("Name"), "abc");
    expect(onChange).toHaveBeenCalled();
  });

  it("respects disabled", () => {
    render(<Input label="Name" disabled />);
    expect(screen.getByLabelText("Name")).toBeDisabled();
  });
});