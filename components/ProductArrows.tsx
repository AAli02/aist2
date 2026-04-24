"use client";

type Props = {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
};

export default function ProductArrows({ label, onPrev, onNext, hasPrev, hasNext }: Props) {
  return (
    <div className="product-arrows fixed bottom-0 inset-x-0 flex items-center justify-center gap-32 md:gap-64 px-6 py-4 bg-[#1a1a1a]/90 backdrop-blur-sm border-t border-white/10">
      <button
        onClick={onPrev}
        disabled={!hasPrev}
        className="arrow-btn w-12 h-12 flex items-center justify-center rounded-full border border-[#ffaa00] text-[#ffaa00] disabled:opacity-20 disabled:cursor-not-allowed hover:bg-[#ffaa00]/10 transition-colors text-xl"
      >
        ‹
      </button>

      <span className="arrow-label text-white font-semibold tracking-widest uppercase text-sm">
        {label}
      </span>

      <button
        onClick={onNext}
        disabled={!hasNext}
        className="arrow-btn w-12 h-12 flex items-center justify-center rounded-full border border-[#ffaa00] text-[#ffaa00] disabled:opacity-20 disabled:cursor-not-allowed hover:bg-[#ffaa00]/10 transition-colors text-xl"
      >
        ›
      </button>
    </div>
  );
}