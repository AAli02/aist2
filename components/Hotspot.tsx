"use client";

type Props = {
  label: string;
  active: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
};

export default function Hotspot({ label, active, onClick, style }: Props) {
  return (
    <button
      onClick={onClick}
      style={style}
      className={[
        "hotspot absolute px-6 py-3 rounded-xl font-bold tracking-widest uppercase text-lg text-white transition-all duration-150 touch-manipulation pointer-events-auto",
        "bg-linear-to-br from-amber-400 to-amber-500 border-2 border-white/30",
        active
          ? "brightness-100 shadow-[0_6px_28px_rgba(255,170,0,0.7)] scale-105"
          : "brightness-75 shadow-none hover:brightness-100 hover:shadow-[0_6px_28px_rgba(255,170,0,0.7)] hover:scale-105 active:scale-95",
      ].join(" ")}
    >
      {label}
    </button>
  );
}