import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider, useToast } from "../Toast";

function TriggerButton() {
  const { push } = useToast();
  return (
    <>
      <button onClick={() => push("success", "Saved successfully")}>
        Save
      </button>
      <button onClick={() => push("error", "Failed to save")}>Fail</button>
      <button onClick={() => push("info", "Loading", 0)}>Sticky</button>
    </>
  );
}

function renderWithProvider() {
  return render(
    <ToastProvider>
      <TriggerButton />
    </ToastProvider>,
  );
}

describe("Toast", () => {
  it("shows success toast", async () => {
    renderWithProvider();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Saved successfully")).toBeVisible();
  });

  it("shows error toast", async () => {
    renderWithProvider();
    await userEvent.click(screen.getByRole("button", { name: "Fail" }));
    expect(screen.getByText("Failed to save")).toBeVisible();
  });

  it("auto-dismisses after duration", async () => {
    vi.useFakeTimers();
    renderWithProvider();
    await userEvent
      .setup({ delay: null })
      .click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Saved successfully")).toBeVisible();
    act(() => {
      vi.advanceTimersByTime(5500);
    });
    expect(screen.queryByText("Saved successfully")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("does NOT auto-dismiss when duration is 0", async () => {
    vi.useFakeTimers();
    renderWithProvider();
    await userEvent
      .setup({ delay: null })
      .click(screen.getByRole("button", { name: "Sticky" }));
    expect(screen.getByText("Loading")).toBeVisible();
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(screen.getByText("Loading")).toBeVisible();
    vi.useRealTimers();
  });

  it("can be dismissed manually", async () => {
    renderWithProvider();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Saved successfully")).toBeVisible();
    await userEvent.click(screen.getByLabelText("Dismiss"));
    expect(screen.queryByText("Saved successfully")).not.toBeInTheDocument();
  });

  it("shows multiple toasts independently", async () => {
    renderWithProvider();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await userEvent.click(screen.getByRole("button", { name: "Fail" }));
    expect(screen.getByText("Saved successfully")).toBeVisible();
    expect(screen.getByText("Failed to save")).toBeVisible();
  });

  it("uses aria-live polite for accessibility", () => {
    renderWithProvider();
    const region = document.querySelector('[aria-live="polite"]');
    expect(region).toBeInTheDocument();
  });

  it("throws when used outside provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TriggerButton />)).toThrow(
      /useToast must be used within ToastProvider/,
    );
    spy.mockRestore();
  });
});