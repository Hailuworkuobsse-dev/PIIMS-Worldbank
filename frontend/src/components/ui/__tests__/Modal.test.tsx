import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "../Modal";

describe("Modal", () => {
  it("renders when open", () => {
    render(
      <Modal open onClose={() => {}} title="Test modal">
        <p>Body content</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Test modal")).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <Modal open={false} onClose={() => {}} title="Test">
        <p>Hidden</p>
      </Modal>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onClose when close button clicked", async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Test">
        <p>x</p>
      </Modal>,
    );
    await userEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Test">
        <p>x</p>
      </Modal>,
    );
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("traps focus inside", async () => {
    render(
      <Modal
        open
        onClose={() => {}}
        title="Test"
        footer={
          <>
            <button>Cancel</button>
            <button>OK</button>
          </>
        }
      >
        <input aria-label="field" />
      </Modal>,
    );
    const buttons = screen.getAllByRole("button");
    const lastButton = buttons[buttons.length - 1]!;
    lastButton.focus();
    await userEvent.tab();
    // focus should wrap to close button (first focusable)
    expect(screen.getByRole("dialog")).toContainElement(document.activeElement);
  });

  it("uses aria-modal and aria-labelledby", () => {
    render(
      <Modal open onClose={() => {}} title="Accessible">
        content
      </Modal>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "modal-title");
  });
});