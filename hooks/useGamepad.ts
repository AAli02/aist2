"use client";

import { useEffect, useRef } from "react";

export type GamepadAction =
  | "dpad-left"
  | "dpad-right"
  | "dpad-up"
  | "dpad-down"
  | "a"
  | "b"
  | "x"
  | "y";

// Standard Xbox button indices (Gamepad API)
const BUTTON_MAP: Record<number, GamepadAction> = {
  0: "a",
  1: "b",
  2: "x",
  3: "y",
  12: "dpad-up",
  13: "dpad-down",
  14: "dpad-left",
  15: "dpad-right",
};

type Options = {
  onAction: (action: GamepadAction) => void;
  repeatDelay?: number; // ms between repeats while held
};

export function useGamepad({ onAction, repeatDelay = 200 }: Options) {
  const pressed = useRef<Set<number>>(new Set());
  const lastFire = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    let raf: number;

    function poll() {
      const gamepads = navigator.getGamepads?.();
      const gp = gamepads ? Array.from(gamepads).find((g) => g !== null) : null; if (gp) {
        const now = Date.now();
        gp.buttons.forEach((btn, idx) => {
          const action = BUTTON_MAP[idx];
          if (!action) return;

          if (btn.pressed) {
            const last = lastFire.current.get(idx) ?? 0;
            if (!pressed.current.has(idx) || now - last >= repeatDelay) {
              onAction(action);
              pressed.current.add(idx);
              lastFire.current.set(idx, now);
            }
          } else {
            pressed.current.delete(idx);
            lastFire.current.delete(idx);
          }
        });
      }
      raf = requestAnimationFrame(poll);
    }

    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, [onAction, repeatDelay]);
}