"use client";

import { usePathname, useRouter } from "next/navigation";
import { useGamepad } from "@/hooks/useGamepad";
import { useCallback } from "react";

const TABS = [
  { label: "Product Catalog", route: "/" },
  { label: "Electrode Game", route: "/electrode-game" },
  // { label: "Video Gallery",   route: "/video-gallery"  },
  { label: "Contact", route: "/contact" },
];

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();

  const activeIdx = TABS.findIndex((t) => t.route === pathname);

  const handleAction = useCallback((action: string) => {
    if (action === "x") {
      const prev = Math.max(0, activeIdx - 1);
      router.push(TABS[prev].route);
    }
    if (action === "b") {
      const next = Math.min(TABS.length - 1, activeIdx + 1);
      router.push(TABS[next].route);
    }
  }, [activeIdx, router]);

  useGamepad({ onAction: handleAction });

  return (
    <nav className="navbar fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pt-4 pb-0 border-b border-white/10 bg-[#242424]">      {TABS.map((tab) => (
      <button
        key={tab.route}
        onClick={() => router.push(tab.route)}
        className={[
          "page-tab px-4 py-2 text-sm font-semibold tracking-widest uppercase transition-colors",
          pathname === tab.route
            ? "text-[#ffaa00] border-b-2 border-[#ffaa00]"
            : "text-white/50 border-b-2 border-transparent hover:text-white",
        ].join(" ")}
      >
        {tab.label}
      </button>
    ))}
    </nav>
  );
}