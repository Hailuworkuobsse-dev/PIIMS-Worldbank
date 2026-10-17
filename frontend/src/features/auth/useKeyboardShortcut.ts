import { useEffect, useRef } from "react";

type Handler = (e: KeyboardEvent) => void;

export interface Shortcut {
  /** Sequence of keys, e.g. ['g','d'] for g-then-d. Single char array for single key. */
  keys: string[];
  handler: Handler;
  /** Ignore when focus is inside an input/textarea/select. Default true. */
  ignoreInInput?: boolean;
  /** Optional modifier set: ctrl, meta, shift, alt. Only applies to single-key. */
  modifiers?: {
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
  };
  /** Description for the help overlay. */
  description?: string;
}

const isEditable = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (el.isContentEditable) return true;
  return false;
};

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const bufferRef = useRef<string[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const reset = () => {
      bufferRef.current = [];
    };

    const onKey = (e: KeyboardEvent) => {
      // Modifier-only keypresses shouldn't be captured
      if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;

      // Escape always resets the buffer
      if (e.key === "Escape") {
        reset();
        return;
      }

      const editable = isEditable(e.target);
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      for (const s of shortcuts) {
        const ignore = s.ignoreInInput ?? true;
        if (editable && ignore) continue;

        // Single-key with modifiers
        if (s.keys.length === 1 && s.keys[0] === key) {
          const m = s.modifiers ?? {};
          const okMods =
            (m.ctrl === undefined || m.ctrl === e.ctrlKey) &&
            (m.meta === undefined || m.meta === e.metaKey) &&
            (m.shift === undefined || m.shift === e.shiftKey) &&
            (m.alt === undefined || m.alt === e.altKey);
          if (okMods) {
            e.preventDefault();
            s.handler(e);
            reset();
            return;
          }
        }
      }

      // Multi-key sequence: only advance if the first key matches some sequence
      const next = [...bufferRef.current, key];
      const candidates = shortcuts.filter(
        (s) =>
          s.keys.length === next.length &&
          s.keys.every((k, i) => k === next[i]),
      );

      // If no candidate at this length, check if any longer sequence starts with `next`
      const hasPrefix = shortcuts.some(
        (s) =>
          s.keys.length > next.length && next.every((k, i) => s.keys[i] === k),
      );

      if (candidates.length > 0) {
        const s = candidates[0]!;
        const ignore = s.ignoreInInput ?? true;
        if (!(editable && ignore)) {
          e.preventDefault();
          s.handler(e);
        }
        reset();
        return;
      }

      if (hasPrefix) {
        bufferRef.current = next;
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(reset, 1500);
      } else {
        reset();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [shortcuts]);
}