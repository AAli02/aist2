"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PRODUCTS, { HOME_SEQUENCE } from "@/data/product-map";
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
  const [productIdx, setProductIdx] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState(0);
  const [currentProduct, setCurrentProduct] = useState("home");
  const [videoEnded, setVideoEnded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const pendingProductRef = useRef<string | null>(null);

  const product = PRODUCTS[currentProduct];
  const hotspots = product.hotspots;

  const commitSwap = useCallback((key: string) => {
    setCurrentProduct(key);
    setActiveHotspot(0);
    setVideoEnded(false);
    setIsExiting(false);
    pendingProductRef.current = null;
  }, []);

  const goToProduct = useCallback((key: string) => {
    if (isExiting) return; // already playing an exit fade

    const cur = PRODUCTS[currentProduct];

    // If current product has an exit video, play it first
    if (cur.exitVideo && videoRef.current) {
      pendingProductRef.current = key;
      setIsExiting(true);
      setVideoEnded(false);
      const vid = videoRef.current;
      vid.src = `${cur.path}/${cur.exitVideo}`;
      vid.load();
      vid.play();
      return;
    }

    // No exit video — swap immediately
    commitSwap(key);
  }, [currentProduct, isExiting, commitSwap]);

  const handleVideoEnded = useCallback(() => {
    // If we just finished an exit fade, commit the pending swap
    if (isExiting && pendingProductRef.current) {
      commitSwap(pendingProductRef.current);
      return;
    }
    // Normal video ended — show hotspots
    setVideoEnded(true);
  }, [isExiting, commitSwap]);

  const handleAction = useCallback((action: string) => {
    if (isExiting) return; // ignore input during exit fade

    switch (action) {
      case "dpad-left": {
        if (currentProduct === "home") break;
        const idx = HOME_SEQUENCE.indexOf(currentProduct);
        if (idx <= 0) { goToProduct("home"); break; }
        const prev = idx - 1;
        setProductIdx(prev);
        goToProduct(HOME_SEQUENCE[prev]);
        break;
      }
      case "dpad-right": {
        if (currentProduct === "home") {
          setProductIdx(0);
          goToProduct(HOME_SEQUENCE[0]);
        } else {
          const idx = HOME_SEQUENCE.indexOf(currentProduct);
          const next = Math.min(HOME_SEQUENCE.length - 1, idx + 1);
          setProductIdx(next);
          goToProduct(HOME_SEQUENCE[next]);
        }
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

  // During exit fade, videoRef.src is set imperatively — don't use key-swap
  const videoSrc = `${product.path}/${product.videos[0]}`;
  const positions = HOTSPOT_POSITIONS[product.key] ?? [];

  return (
    <main className="catalog h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#242424] flex flex-col">
      <div className="catalog-video relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          key={isExiting ? undefined : videoSrc}
          src={isExiting ? undefined : videoSrc}
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
          if (currentProduct === "home") return;
          const idx = HOME_SEQUENCE.indexOf(currentProduct);
          if (idx <= 0) { goToProduct("home"); return; }
          const prev = idx - 1;
          setProductIdx(prev);
          goToProduct(HOME_SEQUENCE[prev]);
        }}
        onNext={() => {
          if (currentProduct === "home") {
            setProductIdx(0);
            goToProduct(HOME_SEQUENCE[0]);
            return;
          }
          const idx = HOME_SEQUENCE.indexOf(currentProduct);
          if (idx < HOME_SEQUENCE.length - 1) {
            const next = idx + 1;
            setProductIdx(next);
            goToProduct(HOME_SEQUENCE[next]);
          }
        }}
        hasPrev={currentProduct !== "home"}
        hasNext={currentProduct === "home" || HOME_SEQUENCE.indexOf(currentProduct) < HOME_SEQUENCE.length - 1}
      />
    </main>
  );
}