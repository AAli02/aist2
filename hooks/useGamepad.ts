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
  | "y"
  | "l3";

const BUTTON_MAP: Record<number, GamepadAction> = {
  0: "a",
  1: "b",
  2: "x",
  3: "y",
  10: "l3",
  12: "dpad-up",
  13: "dpad-down",
  14: "dpad-left",
  15: "dpad-right",
};

const NO_REPEAT: Set<GamepadAction> = new Set(["l3"]);

type Options = {
  onAction: (action: GamepadAction) => void;
  repeatDelay?: number;
};

export function useGamepad({ onAction, repeatDelay = 200 }: Options) {
  const pressed = useRef<Set<number>>(new Set());
  const lastFire = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    let raf: number;

    function poll() {
      const gamepads = navigator.getGamepads?.();
      const gp = gamepads
        ? Array.from(gamepads).find((g) => g !== null)
        : null;

      if (gp) {
        const now = Date.now();
        gp.buttons.forEach((btn, idx) => {
          const action = BUTTON_MAP[idx];
          if (!action) return;

          if (btn.pressed) {
            if (!pressed.current.has(idx)) {
              onAction(action);
              pressed.current.add(idx);
              if (!NO_REPEAT.has(action)) lastFire.current.set(idx, now);
            } else if (!NO_REPEAT.has(action)) {
              const last = lastFire.current.get(idx) ?? 0;
              if (now - last >= repeatDelay) {
                onAction(action);
                lastFire.current.set(idx, now);
              }
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