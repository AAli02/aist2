"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PRODUCTS, { TRAVERSAL } from "@/data/product-map";
import { useGamepad } from "@/hooks/useGamepad";
import ProductArrows from "@/components/ProductArrows";
import Hotspot from "@/components/Hotspot";
import ControllerHUD from "@/components/ControllerHUD";
import MiniMap from "@/components/Minimap";


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
    { top: "34%", left: "66%" },
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
  const [fadeOut, setFadeOut] = useState(false);
  const [showHUD, setShowHUD] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const pendingProductRef = useRef<string | null>(null);

  const product = PRODUCTS[currentProduct];
  const hotspots = product.hotspots;

  const commitSwap = useCallback((key: string) => {
    const next = PRODUCTS[key];
    const bg = bgVideoRef.current;
    const fg = videoRef.current;
    if (!bg || !fg) return;

    bg.src = `${next.path}/${next.videos[0]}`;
    bg.load();

    setFadeOut(true);

    setTimeout(() => {
      fg.src = bg.src;
      fg.load();
      fg.play().catch(() => { });
      setCurrentProduct(key);
      setActiveHotspot(0);
      setVideoEnded(false);
      setIsExiting(false);
      pendingProductRef.current = null;
      setFadeOut(false);
    }, 400);
  }, []);

  const goToProduct = useCallback((key: string) => {
    if (isExiting) return;
    commitSwap(key);
  }, [isExiting, commitSwap]);

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
      case "lb": {
        const prev = Math.max(0, activeTab - 1);
        setActiveTab(prev);
        router.push(TABS[prev].route);
        break;
      }
      case "rb": {
        const next = Math.min(TABS.length - 1, activeTab + 1);
        setActiveTab(next);
        router.push(TABS[next].route);
        break;
      }
      case "x": {
        const v = videoRef.current;
        if (v) {
          v.currentTime = 0;
          v.play().catch(() => { });
          setVideoEnded(false);
        }
        break;
      }
      case "b": {
        // Back — go to parent (home)
        if (currentProduct !== "home") goToProduct("home");
        break;
      }
      case "y": {
        goToProduct("home");
        break;
      }
      case "l3": {
        setShowHUD((p) => !p);
        break;
      }
    }
  }, [currentProduct, hotspots, activeHotspot, activeTab, videoEnded, isExiting, goToProduct, router]);

  useGamepad({ onAction: handleAction });

  const positions = HOTSPOT_POSITIONS[product.key] ?? [];

  return (
    <main className="catalog h-[calc(100vh-4rem)] w-full overflow-hidden flex flex-col"
      style={{ background: "linear-gradient(180deg, #c8c8c8 0%, #8a8a8a 65%, #a0a0a0 100%)" }}>
      <div className="catalog-video relative flex-1 overflow-hidden">
        <MiniMap currentProduct={currentProduct} onNavigate={goToProduct} />

        <video
          ref={videoRef}
          src={`${product.path}/${product.videos[0]}`}
          autoPlay
          muted
          playsInline
          className="w-100% h-100% object-contain transition-opacity duration-400 ease-in-out"
          style={{ opacity: fadeOut ? 0 : 1 }}
          onEnded={handleVideoEnded}
        />
        <video
          ref={bgVideoRef}
          muted
          playsInline
          className="w-100% h-100% object-contain absolute inset-0 pointer-events-none"
          style={{ opacity: 0 }}
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

        {product.description && (
          <div
            key={currentProduct}
            className="product-description absolute left-0 right-0 px-6 py-4 text-sm whitespace-pre-line font-[Montserrat] font-medium"
            style={{
              bottom: product.descriptionPosition ?? "5%",
              animation: `descFadeIn 700ms ease-in-out ${product.descriptionDelay ?? 500}ms both`,
            }}
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        )}

        {currentProduct !== "home" && (
          <div
            key={`title-${currentProduct}`}
            className="product-title absolute top-[2%] right-6 text-right font-[Montserrat] font-black text-2xl uppercase tracking-wide"
            style={{
              color: "#2a2a2a",
              animation: "descFadeIn 700ms ease-in-out 300ms both",
            }}
          >
            {product.label}
          </div>
        )}

        <ControllerHUD
          visible={showHUD}
          videoEnded={videoEnded}
          isExiting={isExiting}
          hasHotspots={hotspots.length > 0}
          hasPrev={TRAVERSAL.indexOf(currentProduct) > 0}
          hasNext={TRAVERSAL.indexOf(currentProduct) < TRAVERSAL.length - 1}
        />
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