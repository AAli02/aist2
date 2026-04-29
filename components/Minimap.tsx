"use client";

import { useCallback } from "react";
import Image from "next/image";

const PART_POSITIONS: Record<string, { top: number; left: number; width: number; height: number }> = {
  "roof": { top: 8, left: 14, width: 70, height: 32 },
  "4th-hole-elbow": { top: 11, left: -4, width: 68, height: 22 },
  "roof-panel": { top: 27, left: 46, width: 16, height: 10 },
  "upper-shell": { top: 34, left: 14, width: 70, height: 26 },
  "side-wall-panel": { top: 44, left: 43, width: 12, height: 16 },
  "lower-shell": { top: 48, left: 11, width: 73, height: 22.5 },
  "tilt-platform": { top: 45, left: 0, width: 100, height: 45 },
};

const PARENT_MAP: Record<string, string | null> = {
  home: null,
  roof: "home",
  "4th-hole-elbow": "roof",
  "roof-panel": "roof",
  "upper-shell": "home",
  "side-wall-panel": "upper-shell",
  "lower-shell": "home",
  "tilt-platform": "home",
};

function buildBreadcrumb(key: string): string {
  const trail: string[] = [];
  let current: string | null = key;
  while (current) {
    trail.unshift(current.replace(/-/g, " "));
    current = PARENT_MAP[current] ?? null;
  }
  return trail.join(" › ");
}

type MiniMapProps = {
  currentProduct: string;
  onNavigate: (key: string) => void;
};

export default function MiniMap({ currentProduct, onNavigate }: MiniMapProps) {
  const pos = PART_POSITIONS[currentProduct];

  return (
    <div className="minimap absolute top-14 right-8 z-30 select-none">
      <div className="minimap-parts relative" style={{ width: 140, height: 200 }}>
        {/* Full assembly — always visible */}
        <div className="absolute inset-0" style={{ opacity: 0.5 }}>
          <Image src="/minimap/full.png" alt="EAF assembly" fill className="object-contain" />
        </div>

        {/* Active part overlay — only when not home */}
        {pos && (
          <div
            className="absolute"
            style={{
              top: `${pos.top}%`,
              left: `${pos.left}%`,
              width: `${pos.width}%`,
              height: `${pos.height}%`,
              filter: "drop-shadow(0 0 3px #ffaa00)",
              zIndex: 10,
              transition: "all 0.3s",
            }}
          >
            <Image src={`/minimap/${currentProduct}.svg`} alt={currentProduct} fill className="object-contain" />
          </div>
        )}
      </div>
    </div>
  );
}