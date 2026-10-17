import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useKeyboardShortcuts } from "../useKeyboardShortcut";

describe("useKeyboardShortcuts", () => {
  it("fires single-key shortcut", async () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([{ keys: ["?"], handler, ignoreInInput: false }]),
    );
    await userEvent.keyboard("?");
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("fires modifier shortcut", async () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([
        { keys: ["k"], modifiers: { ctrl: true }, handler },
      ]),
    );
    await userEvent.keyboard("{Control>}k{/Control}");
    expect(handler).toHaveBeenCalled();
  });

  it("fires sequence shortcut", async () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([
        { keys: ["g", "d"], handler, ignoreInInput: false },
      ]),
    );
    await userEvent.keyboard("gd");
    expect(handler).toHaveBeenCalledTimes(1);
  });
});