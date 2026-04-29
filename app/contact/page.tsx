"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { useGamepad } from "@/hooks/useGamepad";

type Person = {
  key: string;
  name: string;
  position: string;
  img: string;
  qrValue: string;
};

const PEOPLE: Person[] = [
  { key: "claudia", name: "Claudia Leal", position: "Chief Executive Officer", img: "/headshots/claudia.jpg", qrValue: "https://dot.cards/claudialeal" },
  { key: "pedro", name: "Pedro Quiroga", position: "VP of Operations", img: "/headshots/pedro.jpeg", qrValue: "https://dot.cards/pedroquiroga" },
  { key: "sharon", name: "Sharon Jonet", position: "Engineering Manager", img: "/headshots/sharon.jpg", qrValue: "https://dot.cards/sharonjonnet" },
  { key: "bill", name: "Bill Bennet", position: "Sales Manager", img: "/headshots/bill.jpeg", qrValue: "https://dot.cards/billbennett" },
  { key: "alex", name: "Alex Wittmer", position: "Senior Engineer", img: "/headshots/alex.jpeg", qrValue: "https://dot.cards/alexwittmer" },
  { key: "tony", name: "Tony Ramirez", position: "Inside Sales Manager", img: "/headshots/tony.jpg", qrValue: "https://dot.cards/tony_ramirez" },
  { key: "jesse", name: "Jesse Quiroga", position: "Marketing Specialist", img: "/headshots/jesse.jpg", qrValue: "https://dot.cards/jessequiroga" },
  { key: "emma", name: "Emma Walter", position: "Human Resources", img: "/headshots/emma.jpg", qrValue: "https://dot.cards/emma_walter" },
];

const QR_TILE = {
  key: "qr-site",
  name: "Website",
  position: "Scan to visit",
  img: "/steel-soar/logo.png",
  qrValue: "https://eafabcorp.com",
};

const COLS = 2;

export default function ContactsPage() {
  const tiles = useMemo(() => [...PEOPLE, QR_TILE], []);
  const [flippedKey, setFlippedKey] = useState<string | null>(null);
  const [qrByKey, setQrByKey] = useState<Record<string, string>>({});
  const [selectedIdx, setSelectedIdx] = useState(0);

  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll selected card into view whenever selectedIdx changes
  useEffect(() => {
    cardRefs.current[selectedIdx]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedIdx]);

  const toggle = useCallback(async (key: string, qrValue: string) => {
    setFlippedKey((prev) => (prev === key ? null : key));

    if (!qrByKey[key]) {
      try {
        const dataUrl = await QRCode.toDataURL(qrValue, {
          margin: 4,
          width: 360,
          color: { dark: "#111111", light: "#ffffff" },
        });
        setQrByKey((prev) => ({ ...prev, [key]: dataUrl }));
      } catch (e) {
        console.error("QR generation failed", e);
      }
    }
  }, [qrByKey]);

  const handleAction = useCallback((action: string) => {
    switch (action) {
      case "dpad-right": setSelectedIdx((p) => Math.min(tiles.length - 1, p + 1)); break;
      case "dpad-left": setSelectedIdx((p) => Math.max(0, p - 1)); break;
      case "dpad-down": setSelectedIdx((p) => Math.min(tiles.length - 1, p + COLS)); break;
      case "dpad-up": setSelectedIdx((p) => Math.max(0, p - COLS)); break;
      case "a": {
        const t = tiles[selectedIdx];
        if (t) toggle(t.key, t.qrValue);
        break;
      }
    }
  }, [tiles, selectedIdx, toggle]);

  useGamepad({ onAction: handleAction, repeatDelay: 200 });

  return (
    <main
      className="w-full overflow-auto bg-[#242424] p-8">
      <div className="grid grid-cols-2 gap-5">
        {tiles.map((t, i) => {
          const flipped = flippedKey === t.key;
          const selected = selectedIdx === i;

          return (
            <div
              key={t.key}
              ref={(el) => { cardRefs.current[i] = el; }}
              className={[
                "contact-card aspect-3/4 cursor-pointer rounded-xl overflow-hidden transition-all duration-150 scroll-mt-24 scroll-mb-24",
                selected ? "ring-2 ring-[#ffaa00] ring-offset-2 ring-offset-[#242424]" : "",
              ].join(" ")}
              style={{ perspective: "1200px" }}
              onClick={() => { setSelectedIdx(i); toggle(t.key, t.qrValue); }}
            >
              <div className="relative w-full h-full" style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)", transition: "transform 0.5s ease-out"}}>
                {/* FRONT */}
                <div className="absolute inset-0 flex flex-col" style={{ backfaceVisibility: "hidden" }}>
                  <div className="relative w-full h-full">
                    <Image src={t.img} alt={t.name} fill className="object-cover" sizes="50vw" />
                    <div className="absolute inset-x-0 bottom-0 flex flex-col justify-center items-center h-16 px-2 bg-black/50 backdrop-blur-sm">
                      <div className="name text-sm font-semibold text-white">{t.name}</div>
                      <div className="position text-xs text-[#ffaa00]">{t.position}</div>
                    </div>
                  </div>
                </div>
                {/* BACK */}
                <div
                  className="absolute inset-0 flex flex-col justify-center items-center rounded-xl bg-[#1a1a1a] border border-[#ffaa00]"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <div className="bg-white p-2 rounded">
                    {qrByKey[t.key] ? (
                      <Image src={qrByKey[t.key]} alt={`QR for ${t.name}`} width={160} height={160} />
                    ) : (
                      <div className="w-40 h-40 animate-pulse bg-[#ffaa00] rounded" />
                    )}
                  </div>
                  <div className="mt-3 text-center">
                    <div className="name text-sm font-semibold text-white">{t.name}</div>
                    <div className="position text-xs text-[#ffaa00]">{t.position}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}