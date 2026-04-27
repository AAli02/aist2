"use client";

type HUDProps = {
  videoEnded: boolean;
  isExiting: boolean;
  hasHotspots: boolean;
  hasPrev: boolean;
  hasNext: boolean;
};

type Hint = { button: string; label: string };

const BUTTON_STYLE: Record<string, string> = {
  A: "bg-[#2d7d2d]",
  B: "bg-[#b22020]",
  X: "bg-[#2050b0]",
  Y: "bg-[#c0a020]",
  "◀": "bg-[#444]",
  "▶": "bg-[#444]",
  "▲": "bg-[#444]",
  "▼": "bg-[#444]",
};

function ButtonIcon({ button }: { button: string }) {
  const bg = BUTTON_STYLE[button] ?? "bg-[#444]";
  const isArrow = "◀▶▲▼".includes(button);
  const size = isArrow ? "w-5 h-5 text-[10px]" : "w-5 h-5 text-[11px]";

  return (
    <span
      className={`${bg} ${size} inline-flex items-center justify-center rounded-full text-white font-bold shrink-0`}
    >
      {button}
    </span>
  );
}

export default function ControllerHUD({
  videoEnded,
  isExiting,
  hasHotspots,
  hasPrev,
  hasNext,
}: HUDProps) {
  const hints: Hint[] = [];

  if (!isExiting) {
    if (hasPrev || hasNext) {
      hints.push({ button: "◀", label: "Prev section" });
      hints.push({ button: "▶", label: "Next section" });
    }

    if (videoEnded && hasHotspots) {
      hints.push({ button: "▲", label: "Select up" });
      hints.push({ button: "▼", label: "Select down" });
      hints.push({ button: "A", label: "Confirm" });
    }

    hints.push({ button: "Y", label: "Home" });
  }

  if (hints.length === 0) return null;

  return (
    <div className="controller-hud absolute bottom-16 right-3 z-50 pointer-events-none">
      <div className="hud-panel flex flex-col gap-1.5 bg-black/60 backdrop-blur-sm border border-[#ffaa00]/30 rounded-lg px-3 py-2">
        {hints.map((h) => (
          <div key={h.button} className="hud-row flex items-center gap-2">
            <ButtonIcon button={h.button} />
            <span className="hud-label text-[11px] text-white/70 whitespace-nowrap">
              {h.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}