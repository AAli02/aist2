"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PRODUCTS, { TRAVERSAL } from "@/data/product-map";
import { useGamepad } from "@/hooks/useGamepad";
import ProductArrows from "@/components/ProductArrows";
import Hotspot from "@/components/Hotspot";

const TABS = [
  { route: "/" },
  { route: "/electrode-game" },
  { route: "/video-gallery" },
  { route: "/contact" },
];

const HOTSPOT_POSITIONS: Record<string, { top: string; left: string }[]> = {
  home: [
    { top: "35%", left: "50%" },
    { top: "50%", left: "50%" },
    { top: "64%", left: "50%" },
    { top: "76%", left: "50%" },
  ],
  roof: [
    { top: "34%", left: "58%" },
    { top: "70%", left: "50%" },
  ],
  "upper-shell": [
    { top: "50%", left: "50%" },
  ],
};

export default function CatalogPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState(0);
  const [currentProduct, setCurrentProduct] = useState("home");
  const [videoEnded, setVideoEnded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const pendingProductRef = useRef<string | null>(null);

  const product = PRODUCTS[currentProduct];
  const hotspots = product.hotspots;

  const playVideo = useCallback((src: string) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.src = src;
    vid.load();
    vid.play().catch(() => { });
  }, []);

  const commitSwap = useCallback((key: string) => {
    const next = PRODUCTS[key];
    setCurrentProduct(key);
    setActiveHotspot(0);
    setVideoEnded(false);
    setIsExiting(false);
    pendingProductRef.current = null;
    playVideo(`${next.path}/${next.videos[0]}`);
  }, [playVideo]);

  const goToProduct = useCallback((key: string) => {
    if (isExiting) return;

    const cur = PRODUCTS[currentProduct];

    if (cur.exitVideo) {
      pendingProductRef.current = key;
      setIsExiting(true);
      setVideoEnded(false);
      playVideo(`${cur.path}/${cur.exitVideo}`);
      return;
    }

    commitSwap(key);
  }, [currentProduct, isExiting, commitSwap, playVideo]);

  const handleVideoEnded = useCallback(() => {
    if (isExiting && pendingProductRef.current) {
      commitSwap(pendingProductRef.current);
      return;
    }
    setVideoEnded(true);
  }, [isExiting, commitSwap]);

  const handleAction = useCallback((action: string) => {
    if (isExiting) return;

    switch (action) {
      case "dpad-left": {
        const idx = TRAVERSAL.indexOf(currentProduct);
        if (idx > 0) goToProduct(TRAVERSAL[idx - 1]);
        break;
      }
      case "dpad-right": {
        const idx = TRAVERSAL.indexOf(currentProduct);
        if (idx < TRAVERSAL.length - 1) goToProduct(TRAVERSAL[idx + 1]);
        break;
      }
      case "dpad-up": {
        if (videoEnded && hotspots.length > 0)
          setActiveHotspot((p) => (p - 1 + hotspots.length) % hotspots.length);
        break;
      }
      case "dpad-down": {
        if (videoEnded && hotspots.length > 0)
          setActiveHotspot((p) => (p + 1) % hotspots.length);
        break;
      }
      case "a": {
        if (videoEnded && hotspots.length > 0)
          goToProduct(hotspots[activeHotspot].productKey);
        break;
      }
      case "x": {
        const prev = Math.max(0, activeTab - 1);
        setActiveTab(prev);
        router.push(TABS[prev].route);
        break;
      }
      case "b": {
        const next = Math.min(TABS.length - 1, activeTab + 1);
        setActiveTab(next);
        router.push(TABS[next].route);
        break;
      }
      case "y": {
        goToProduct("home");
        break;
      }
    }
  }, [currentProduct, hotspots, activeHotspot, activeTab, videoEnded, isExiting, goToProduct, router]);

  useGamepad({ onAction: handleAction });

  const positions = HOTSPOT_POSITIONS[product.key] ?? [];

  return (
    <main className="catalog h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#242424] flex flex-col">
      <div className="catalog-video relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          src={`${product.path}/${product.videos[0]}`}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-contain"
          onEnded={handleVideoEnded}
        />

        {videoEnded && !isExiting && product.hotspots.map((hs, i) => (
          <Hotspot
            key={hs.key}
            label={hs.label}
            active={activeHotspot === i}
            onClick={() => goToProduct(hs.productKey)}
            style={positions[i] ? { top: positions[i].top, left: positions[i].left, transform: "translate(-50%, -50%)" } : undefined}
          />
        ))}
      </div>

      <ProductArrows
        label={product.label}
        onPrev={() => {
          const idx = TRAVERSAL.indexOf(currentProduct);
          if (idx > 0) goToProduct(TRAVERSAL[idx - 1]);
        }}
        onNext={() => {
          const idx = TRAVERSAL.indexOf(currentProduct);
          if (idx < TRAVERSAL.length - 1) goToProduct(TRAVERSAL[idx + 1]);
        }}
        hasPrev={TRAVERSAL.indexOf(currentProduct) > 0}
        hasNext={TRAVERSAL.indexOf(currentProduct) < TRAVERSAL.length - 1}
      />

    </main>
  );
}