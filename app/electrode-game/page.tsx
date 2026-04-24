"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import NextImage from "next/image";
import { useGamepad } from "@/hooks/useGamepad";

// ─── Config ──────────────────────────────────────────────────────────────────

const W = 460, H = 840;
const STORAGE_KEY = "steel-soar-scores-v3";

const ASSETS = {
  bg: "/steel-soar/eafabbg.png",
  top: "/steel-soar/top.png",
  bottom: "/steel-soar/bottom.png",
  hat: "/steel-soar/hat.png",
  logo: "/steel-soar/logo.png",
  chars: ["/steel-soar/male-eng.png", "/steel-soar/fem-eng.png", "/steel-soar/welder.png", "/steel-soar/production.png", "/steel-soar/forklift.png"],
  charNames: ["ENGINEER", "ENGINEER", "WELDER", "OPERATOR", "FORKLIFT"],
} as const;

const CFG = {
  gravity: 0.58, jump: -8.5, pipeSpeed: 2.8, maxFallSpeed: 12,
  pipeGap: 220, pipeSpacing: 330, pipeMinTop: 120, pipeMaxTop: 400,
  bird: { x: 92, w: 84, h: 84 }, birdPad: 12,
  pipeHitPadX: 24, pipeHitPadY: 12,
  hatSize: 52, hatChance: 0.55, hatYOffsetRange: 35, groundPad: 12,
  pipeVisualOffsetTop: 8, pipeVisualOffsetBottom: 8,
  flame: { emitPerSecond: 70, sizeMin: 6, sizeMax: 14, lifeMin: 0.25, lifeMax: 0.55, spreadX: 18, spreadY: 26, speedMin: 2.4, speedMax: 6.6, drag: 0.92, lift: -0.08, alpha: 0.85 },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = "home" | "playing" | "over";
type HomeFocus = "char" | "name" | "emailLocal" | "emailDomain" | "emailTld";
type OverFocus = "list" | "play" | "menu";
type ScoreEntry = { username: string; email: string; score: number; character: number; timestamp: number };
type Pipe = { x: number; topH: number; w: number; gap: number; scored: boolean };
type Hat = { x: number; y: number };
type Flame = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number };
type Imgs = { bg: HTMLImageElement; top: HTMLImageElement; bottom: HTMLImageElement; hat: HTMLImageElement; chars: HTMLImageElement[] };
type GS = {
  score: number; hatScore: number; lastHudScore: number; lastHudHatScore: number;
  bird: { x: number; y: number; w: number; h: number; vy: number };
  pipes: Pipe[]; hats: Hat[]; flames: Flame[]; flameCarry: number;
  lastTopH: number; gameStarted: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const rectHit = (ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) =>
  ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

const EMAIL_PART_RE = /^[^\s@.]+$/;

function loadScores(): ScoreEntry[] {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((o): o is Record<string, unknown> => typeof o === "object" && o !== null).map((o) => ({
      username: typeof o.username === "string" ? o.username.slice(0, 12) : "PLAYER",
      email: typeof o.email === "string" ? o.email : "",
      score: typeof o.score === "number" ? o.score : 0,
      character: typeof o.character === "number" ? o.character : 0,
      timestamp: typeof o.timestamp === "number" ? o.timestamp : Date.now(),
    }));
  } catch { return []; }
}

function saveScores(scores: ScoreEntry[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(scores)); } catch { /* ignore */ }
}

function initGS(): GS {
  return {
    score: 0, hatScore: 0, lastHudScore: -1, lastHudHatScore: -1,
    bird: { x: CFG.bird.x, y: H * 0.5, w: CFG.bird.w, h: CFG.bird.h, vy: 0 },
    pipes: [], hats: [], flames: [], flameCarry: 0,
    lastTopH: Math.floor((CFG.pipeMinTop + CFG.pipeMaxTop) / 2), gameStarted: false,
  };
}

function pipeWidth(imgs: Imgs | null) { return Math.max(72, Math.min(110, imgs?.top.naturalWidth || 120)); }
function dynGap(score: number) { return Math.max(180, Math.floor(CFG.pipeGap - score * 0.8)); }

// ─── Component ────────────────────────────────────────────────────────────────

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const imgsRef = useRef<Imgs | null>(null);
  const gameRef = useRef<GS>(initGS());
  const guardRef = useRef(false);

  // timing refs
  const lastTsRef = useRef(0);
  const accRef = useRef(0);
  const lastHudRef = useRef(0);

  // stable refs for callbacks inside rAF
  const screenRef = useRef<Screen>("home");
  const charRef = useRef(0);
  const endGameRef = useRef<() => void>(() => { });
  const hudRef = useRef<(s: number, h: number) => void>(() => { });

  // input refs for focus control
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailLocalRef = useRef<HTMLInputElement>(null);
  const emailDomainRef = useRef<HTMLInputElement>(null);
  const emailTldRef = useRef<HTMLInputElement>(null);

  const [screen, setScreen] = useState<Screen>("home");
  const [char, setChar] = useState(0);
  const [homeFocus, setHomeFocus] = useState<HomeFocus>("char");
  const [overFocus, setOverFocus] = useState<OverFocus>("play");
  const scoreListRef = useRef<HTMLDivElement>(null);
  const [nameInput, setNameInput] = useState("test");
  const [emailLocal, setEmailLocal] = useState("test");
  const [emailDomain, setEmailDomain] = useState("test");
  const [emailTld, setEmailTld] = useState("test");
  const [assetsReady, setAssetsReady] = useState(false);
  const [logoOk, setLogoOk] = useState(true);
  const [tapVisible, setTapVisible] = useState(false);
  const [hudScore, setHudScore] = useState(0);
  const [hudHat, setHudHat] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [finalHat, setFinalHat] = useState(0);
  const [best, setBest] = useState(0);
  const [topScores, setTopScores] = useState<ScoreEntry[]>([]);
  const [validationMsg, setValidationMsg] = useState("");

  const username = nameInput.trim().replace(/[^\w ]+/g, "").trim().slice(0, 12) || "PLAYER";
  const pipeScore = Math.max(0, hudScore - hudHat);
  const nameValid = nameInput.trim().length > 0;
  const localValid = EMAIL_PART_RE.test(emailLocal.trim());
  const domainValid = EMAIL_PART_RE.test(emailDomain.trim());
  const tldValid = EMAIL_PART_RE.test(emailTld.trim()) && emailTld.trim().length >= 2;
  const emailValid = localValid && domainValid && tldValid;
  const fullEmail = `${emailLocal.trim()}@${emailDomain.trim()}.${emailTld.trim()}`;
  const canStart = assetsReady && nameValid && emailValid;

  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { charRef.current = char; }, [char]);

  //x auto-focus the active input when focus changes on home screen
  // use synthetic click so the browser treats it as user-initiated and shows the caret
  const activateInput = useCallback((el: HTMLInputElement | null) => {
    if (!el) return;
    el.click();
    el.focus();
    // place cursor at end of current value
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, []);

  useEffect(() => {
    if (screen !== "home") return;
    const t = window.setTimeout(() => {
      if (homeFocus === "name") activateInput(nameInputRef.current);
      else if (homeFocus === "emailLocal") activateInput(emailLocalRef.current);
      else if (homeFocus === "emailDomain") activateInput(emailDomainRef.current);
      else if (homeFocus === "emailTld") activateInput(emailTldRef.current);
      else {
        nameInputRef.current?.blur();
        emailLocalRef.current?.blur();
        emailDomainRef.current?.blur();
        emailTldRef.current?.blur();
      }
    }, 16);
    return () => window.clearTimeout(t);
  }, [homeFocus, screen, activateInput]);

  // reset focus to char when entering home
  useEffect(() => { if (screen === "home") setHomeFocus("char"); }, [screen]);

  useEffect(() => { if (screen === "over") setOverFocus("play"); }, [screen]);
  // ── Actions ────────────────────────────────────────────────────────────────

  const jumpOrStart = useCallback(() => {
    if (screenRef.current !== "playing") return;
    const G = gameRef.current;
    if (!G.gameStarted) {
      gameRef.current = { ...G, gameStarted: true, bird: { ...G.bird, vy: CFG.jump } };
      setTapVisible(false);
    } else {
      gameRef.current = { ...G, bird: { ...G.bird, vy: CFG.jump } };
    }
  }, []);

  const startGame = useCallback(() => {
    if (!nameValid) { setValidationMsg("Please enter your name"); setHomeFocus("name"); return; }
    if (!localValid) { setValidationMsg("Enter email name"); setHomeFocus("emailLocal"); return; }
    if (!domainValid) { setValidationMsg("Enter email domain"); setHomeFocus("emailDomain"); return; }
    if (!tldValid) { setValidationMsg("Enter valid tld"); setHomeFocus("emailTld"); return; }
    setValidationMsg("");
    gameRef.current = initGS();
    setHudScore(0); setHudHat(0); setFinalScore(0); setFinalHat(0);
    lastTsRef.current = 0; accRef.current = 0; lastHudRef.current = 0;
    guardRef.current = false;
    setTapVisible(true);
    setScreen("playing");
  }, [nameValid, localValid, domainValid, tldValid]);

  const backToMenu = useCallback(() => {
    setNameInput("");
    setEmailLocal("");
    setEmailDomain("");
    setEmailTld("");
    setValidationMsg("");
    setScreen("home");
    setTapVisible(false);
  }, []);

  const endGame = useCallback(() => {
    const G = gameRef.current;
    const entry: ScoreEntry = { username, email: fullEmail, score: G.score, character: charRef.current, timestamp: Date.now() };
    const scores = [...loadScores(), entry].sort((a, b) => b.score - a.score || b.timestamp - a.timestamp).slice(0, 2000);
    saveScores(scores);
    setFinalScore(G.score); setFinalHat(G.hatScore);
    setBest(scores.filter(s => s.username === username).reduce((m, s) => Math.max(m, s.score), 0));
    setTopScores(scores.slice(0, 10));
    setScreen("over"); setTapVisible(false);
  }, [username, fullEmail]);

  useEffect(() => { endGameRef.current = endGame; }, [endGame]);
  useEffect(() => { hudRef.current = (s, h) => { setHudScore(s); setHudHat(h); }; }, []);

  // ── Gamepad ────────────────────────────────────────────────────────────────

  const handleGamepad = useCallback((action: string) => {
    if (action === "a") {
      if (screenRef.current === "playing") { jumpOrStart(); return; }
      if (screenRef.current === "home" && imgsRef.current) { startGame(); return; }
      if (screenRef.current === "over") {
        if (overFocus === "menu") backToMenu(); else startGame();
        return;
      }
    }
    if (screenRef.current === "home") {
      if (action === "dpad-left") {
        if (homeFocus === "char") setChar((p) => Math.max(0, p - 1));
        else if (homeFocus === "emailDomain") setHomeFocus("emailLocal");
        else if (homeFocus === "emailTld") setHomeFocus("emailDomain");
      }
      if (action === "dpad-right") {
        if (homeFocus === "char") setChar((p) => Math.min(ASSETS.chars.length - 1, p + 1));
        else if (homeFocus === "emailLocal") setHomeFocus("emailDomain");
        else if (homeFocus === "emailDomain") setHomeFocus("emailTld");
      }
      if (action === "dpad-up") {
        setHomeFocus((f) => {
          if (f === "emailLocal" || f === "emailDomain" || f === "emailTld") return "name";
          if (f === "name") return "char";
          return "char";
        });
      }
      if (action === "dpad-down") {
        setHomeFocus((f) => {
          if (f === "char") return "name";
          if (f === "name") return "emailLocal";
          return f;
        });
      }
    }
    if (screenRef.current === "over") {
      if (action === "dpad-up") {
        if (overFocus === "list") scoreListRef.current?.scrollBy({ top: -40, behavior: "smooth" });
        else setOverFocus("list");
      }
      if (action === "dpad-down") {
        if (overFocus === "list") {
          const el = scoreListRef.current;
          if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 2) setOverFocus("play");
          else el?.scrollBy({ top: 40, behavior: "smooth" });
        }
      }
      if (action === "dpad-left") { if (overFocus !== "list") setOverFocus("play"); }
      if (action === "dpad-right") { if (overFocus !== "list") setOverFocus("menu"); }
    }
  }, [jumpOrStart, startGame, backToMenu, homeFocus, overFocus]);

  useGamepad({ onAction: handleGamepad });

  // ── Load assets ────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    const make = (src: string) => new Promise<HTMLImageElement>((res) => {
      const im = new window.Image();
      im.onload = im.onerror = () => res(im);
      im.src = src;
    });
    (async () => {
      const [bg, top, bottom, hat, ...chars] = await Promise.all([make(ASSETS.bg), make(ASSETS.top), make(ASSETS.bottom), make(ASSETS.hat), ...ASSETS.chars.map(make)]);
      if (cancelled) return;
      imgsRef.current = { bg, top, bottom, hat, chars };
      const ok = [bg, top, bottom, hat, ...chars].every(i => i.naturalWidth > 0);
      setAssetsReady(ok);
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Keyboard ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (screenRef.current === "playing" && (e.code === "Space" || e.code === "ArrowUp")) { e.preventDefault(); jumpOrStart(); }
      if (screenRef.current !== "playing" && e.code === "Enter") { e.preventDefault(); startGame(); }
    };
    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey);
  }, [jumpOrStart, startGame]);

  // ── Visibility pause ───────────────────────────────────────────────────────

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible" && screenRef.current === "playing") {
        const G = gameRef.current;
        gameRef.current = { ...G, gameStarted: false, bird: { ...G.bird, vy: 0 } };
        setTapVisible(true);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // ── Main loop ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    const STEP = 1000 / 60, MAX_FRAME = 1000 / 12, MAX_STEPS = 6;

    // draw helpers
    const drawImg = (im: HTMLImageElement | undefined, ...args: [number, number, number, number]) => { if (im?.complete && im.naturalWidth > 0) ctx.drawImage(im, ...args); };

    const draw = (G: GS) => {
      const imgs = imgsRef.current;
      const OD = 140;
      drawImg(imgs?.bg, 0, 0, W, H);
      if (!imgs?.bg.complete) { ctx.fillStyle = "#111827"; ctx.fillRect(0, 0, W, H); }

      for (const p of G.pipes) {
        const pw = p.w, by = p.topH + p.gap;
        if (imgs?.top.complete && imgs.top.naturalWidth > 0) ctx.drawImage(imgs.top, p.x, -OD - CFG.pipeVisualOffsetTop, pw, p.topH + OD);
        else { ctx.fillStyle = "#374151"; ctx.fillRect(p.x, 0, pw, p.topH); }
        if (imgs?.bottom.complete && imgs.bottom.naturalWidth > 0) ctx.drawImage(imgs.bottom, p.x, by + CFG.pipeVisualOffsetBottom, pw, H - by + OD);
        else { ctx.fillStyle = "#374151"; ctx.fillRect(p.x, by, pw, H - by); }
      }

      for (const h of G.hats) { const s = CFG.hatSize; drawImg(imgs?.hat, h.x - s / 2, h.y - s / 2, s, s); }

      if (G.flames.length > 0) {
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        for (const p of G.flames) {
          const t = clamp(p.life / p.maxLife, 0, 1), a = CFG.flame.alpha * t;
          ctx.globalAlpha = a; ctx.fillStyle = "rgba(255,190,60,1)";
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.55, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = a * 0.7; ctx.fillStyle = "rgba(255,90,40,1)";
          ctx.beginPath(); ctx.arc(p.x - 1, p.y + 2, p.size, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }

      const bim = imgs?.chars[charRef.current];
      if (bim?.complete && bim.naturalWidth > 0) ctx.drawImage(bim, G.bird.x, G.bird.y, G.bird.w, G.bird.h);
      else { ctx.fillStyle = "#fff"; ctx.fillRect(G.bird.x, G.bird.y, G.bird.w, G.bird.h); }
    };

    // physics helpers
    const spawnPipe = (G: GS, x: number): GS => {
      const pw = pipeWidth(imgsRef.current), gap = dynGap(G.score);
      const mn = Math.max(CFG.pipeMinTop, 90), mx = Math.min(CFG.pipeMaxTop, H - CFG.groundPad - gap - 110);
      const sMin = Math.min(mn, mx), sMax = Math.max(mn, mx);
      const target = Math.floor(sMin + Math.random() * (sMax - sMin));
      const topH = clamp(clamp(target, (G.lastTopH || target) - 95, (G.lastTopH || target) + 95), sMin, sMax);
      const pipes = [...G.pipes, { x, topH, w: pw, gap, scored: false }];
      const hats = Math.random() < CFG.hatChance
        ? [...G.hats, { x: x + pw / 2, y: topH + gap / 2 + (Math.random() * CFG.hatYOffsetRange - CFG.hatYOffsetRange / 2) }]
        : G.hats;
      return { ...G, pipes, hats, lastTopH: topH };
    };

    const ensurePipes = (G: GS): GS => {
      if (!G.pipes.length) return spawnPipe(G, W + 180);
      const last = G.pipes[G.pipes.length - 1];
      return last && last.x < W + 140 ? spawnPipe(G, last.x + CFG.pipeSpacing) : G;
    };

    const step = (G: GS): { G: GS; hit: boolean } => {
      const dt = 1 / 60;
      // flames
      const ox = G.bird.x + G.bird.w / 2, oy = G.bird.y + G.bird.h - 10;
      const emitN = Math.floor(G.flameCarry + CFG.flame.emitPerSecond * dt);
      const carry = G.flameCarry + CFG.flame.emitPerSecond * dt - emitN;
      const newF: Flame[] = G.gameStarted ? Array.from({ length: emitN }, () => {
        const size = CFG.flame.sizeMin + Math.random() * (CFG.flame.sizeMax - CFG.flame.sizeMin);
        const ml = CFG.flame.lifeMin + Math.random() * (CFG.flame.lifeMax - CFG.flame.lifeMin);
        const sp = CFG.flame.speedMin + Math.random() * (CFG.flame.speedMax - CFG.flame.speedMin);
        return {
          x: ox + (Math.random() * 2 - 1) * CFG.flame.spreadX, y: oy + (Math.random() * 2 - 1) * CFG.flame.spreadY,
          vx: -sp * 0.55 + (Math.random() * 2 - 1) * 0.9, vy: sp * 0.95 + (Math.random() * 2 - 1) * 0.8, life: ml, maxLife: ml, size
        };
      }) : [];
      const flames = [...G.flames, ...newF].map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vx: p.vx * CFG.flame.drag, vy: p.vy * CFG.flame.drag + CFG.flame.lift, life: p.life - dt })).filter(p => p.life > 0);

      // world
      const pw = pipeWidth(imgsRef.current);
      const pipes = G.pipes.map(p => ({ ...p, x: p.x - CFG.pipeSpeed })).filter(p => p.x > -pw - 120);
      const hats = G.hats.map(h => ({ ...h, x: h.x - CFG.pipeSpeed })).filter(h => h.x > -120);

      // bird
      const vy = G.gameStarted ? Math.min(G.bird.vy + CFG.gravity, CFG.maxFallSpeed) : 0;
      const by = G.bird.y + vy;

      // score
      let score = G.score;
      const scoredPipes = pipes.map(p => (!p.scored && G.bird.x > p.x + p.w) ? (score++, { ...p, scored: true }) : p);

      const G2 = { ...G, flames, flameCarry: carry, pipes: scoredPipes, hats, bird: { ...G.bird, vy, y: by }, score };

      // collisions
      if (!G2.gameStarted) return { G: G2, hit: false };
      if (by < 0 || by + G2.bird.h > H - CFG.groundPad) return { G: G2, hit: true };
      const bp = CFG.birdPad, bx = G2.bird.x + bp, bY = by + bp, bw = G2.bird.w - bp * 2, bh = G2.bird.h - bp * 2;
      for (const p of G2.pipes) {
        const px = p.x + CFG.pipeHitPadX, ppw = p.w - CFG.pipeHitPadX * 2, bY2 = p.topH + p.gap + CFG.pipeHitPadY;
        if (rectHit(bx, bY, bw, bh, px, 0, ppw, Math.max(0, p.topH - CFG.pipeHitPadY))) return { G: G2, hit: true };
        if (rectHit(bx, bY, bw, bh, px, bY2, ppw, Math.max(0, H - CFG.groundPad - bY2))) return { G: G2, hit: true };
      }
      let hatScore = G2.hatScore; let sc2 = G2.score;
      const hatsKept = G2.hats.filter(h => {
        const s = CFG.hatSize;
        if (rectHit(bx, bY, bw, bh, h.x - s / 2, h.y - s / 2, s, s)) { hatScore++; sc2++; return false; }
        return true;
      });
      return { G: { ...G2, hats: hatsKept, hatScore, score: sc2 }, hit: false };
    };

    const tick = (ts: number) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const frameMs = Math.min(MAX_FRAME, Math.max(0, ts - lastTsRef.current));
      lastTsRef.current = ts;
      accRef.current += frameMs;

      if (screenRef.current === "playing") {
        let G = ensurePipes(gameRef.current);
        let steps = 0;
        while (accRef.current >= STEP && steps < MAX_STEPS) {
          accRef.current -= STEP; steps++;
          const r = step(G); G = r.G;
          if (r.hit && !guardRef.current) {
            guardRef.current = true; gameRef.current = G;
            window.setTimeout(() => { endGameRef.current(); guardRef.current = false; }, 0);
            break;
          }
        }
        gameRef.current = G;
        draw(G);
        if (G.gameStarted && ts - lastHudRef.current >= 90) {
          if (G.score !== G.lastHudScore || G.hatScore !== G.lastHudHatScore) {
            hudRef.current(G.score, G.hatScore);
            gameRef.current = { ...G, lastHudScore: G.score, lastHudHatScore: G.hatScore };
          }
          lastHudRef.current = ts;
        }
      } else {
        draw(gameRef.current);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  const emailBoxClass = (active: boolean, valid: boolean) => [
    "rounded-lg border-2 bg-black/55 backdrop-blur-sm px-2 py-2 text-center text-white text-sm font-bold tracking-wider outline-none placeholder:text-white/45 transition-all",
    active ? "border-[#ffd246] shadow-[0_0_0_2px_rgba(255,210,70,0.25)]" : valid ? "border-white/25" : "border-red-400/40"
  ].join(" ");

  return (
    <div className="fixed inset-x-0 bottom-0 top-13.5 bg-black grid place-items-center">
      <div className="relative" style={{ width: "min(100vw, calc(100svh * 460 / 840))", height: "min(100svh, calc(100vw * 840 / 460))" }}>
        <canvas
          ref={canvasRef}
          tabIndex={-1}
          className="absolute inset-0 w-full h-full block bg-black [image-rendering:pixelated] select-none touch-none"
          style={{ cursor: screen === "playing" ? "pointer" : "default" }}
          onPointerDown={(e) => { e.preventDefault(); if (screenRef.current === "playing") jumpOrStart(); }}
        />

        {/* HUD */}
        {screen === "playing" && (
          <div className="pointer-events-none absolute inset-0 z-10 pt-2 px-2">
            <div className="flex gap-2">
              <div className="rounded-xl border-2 border-white/25 bg-black/60 backdrop-blur-sm px-3 py-1.5 text-white font-black text-lg tracking-wide">🚀 {pipeScore}</div>
              <div className="rounded-xl border-2 border-[#ffd246]/40 bg-black/60 backdrop-blur-sm px-3 py-1.5 text-white font-black text-lg tracking-wide flex items-center gap-2">
                <span className="relative w-5 h-5"><NextImage src={ASSETS.hat} alt="Hat" fill unoptimized draggable={false} className="object-contain [image-rendering:pixelated]" /></span>
                {hudHat}
              </div>
            </div>
            {tapVisible && (
              <div className="absolute inset-x-0 bottom-24 grid place-items-center">
                <div className="rounded-full border-2 border-white/25 bg-black/60 backdrop-blur-sm px-5 py-2.5 text-white font-black tracking-wider">TAP TO START</div>
              </div>
            )}
          </div>
        )}

        {/* HOME */}
        {screen === "home" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-4 pt-3 pb-4 bg-black/35 backdrop-blur-sm">
            {logoOk
              ? <div className="w-[min(360px,88%)] -mt-14 mb-0.5"><NextImage src={ASSETS.logo} alt="GAME" width={900} height={360} sizes="88vw" unoptimized priority className="w-full h-auto [image-rendering:pixelated] drop-shadow-[0_10px_8px_rgba(0,0,0,0.55)]" onError={() => setLogoOk(false)} /></div>
              : <div className="text-5xl font-black text-white -mt-10">GAME</div>
            }

            {/* Character select */}
            <div
              onClick={() => setHomeFocus("char")}
              className={["flex gap-2 p-2 rounded-xl bg-black/55 border-2 backdrop-blur-sm transition-all cursor-pointer",
                homeFocus === "char" ? "border-[#ffd246] shadow-[0_0_0_2px_rgba(255,210,70,0.25)]" : "border-white/20"].join(" ")}>
              {ASSETS.chars.map((src, i) => (
                <div key={src} className="flex flex-col items-center gap-1.5">
                  <button type="button" onClick={(e) => { e.stopPropagation(); setChar(i); setHomeFocus("char"); }}
                    className={["w-14 h-14 rounded-lg border-2 grid place-items-center transition-all duration-200 bg-white/5",
                      i === char ? "border-[#ffd246] bg-[#ffd246]/20 scale-105" : "border-white/20 hover:scale-105 hover:border-white/40"].join(" ")}>
                    <NextImage src={src} alt="" width={44} height={44} className="w-11 h-11 object-contain [image-rendering:pixelated]" draggable={false} unoptimized />
                  </button>
                  <div className="text-[9px] font-bold text-white/80 tracking-tight">{ASSETS.charNames[i]}</div>
                </div>
              ))}
            </div>

            <input ref={nameInputRef} value={nameInput} onChange={e => setNameInput(e.target.value)} onFocus={() => setHomeFocus("name")} maxLength={12} placeholder="ENTER NAME *" autoComplete="off" required
              className={["w-52 rounded-full border-2 bg-black/55 backdrop-blur-sm px-5 py-2 text-center text-white text-base font-bold tracking-wider outline-none placeholder:text-white/55 transition-all",
                homeFocus === "name" ? "border-[#ffd246] shadow-[0_0_0_2px_rgba(255,210,70,0.25)]" : nameValid ? "border-white/25" : "border-red-400/40"].join(" ")} />

            {/* Split email input: local @ domain . tld */}
            <div className="flex items-center gap-1 w-[min(340px,94%)]">
              <input
                ref={emailLocalRef}
                value={emailLocal}
                onChange={e => setEmailLocal(e.target.value.replace(/[\s@.]/g, ""))}
                onFocus={() => setHomeFocus("emailLocal")}
                maxLength={20}
                placeholder="name"
                autoComplete="off"
                className={`flex-1 min-w-0 ${emailBoxClass(homeFocus === "emailLocal", localValid)}`}
              />
              <span className="text-white font-black text-lg select-none">@</span>
              <input
                ref={emailDomainRef}
                value={emailDomain}
                onChange={e => setEmailDomain(e.target.value.replace(/[\s@.]/g, ""))}
                onFocus={() => setHomeFocus("emailDomain")}
                maxLength={20}
                placeholder="domain"
                autoComplete="off"
                className={`flex-1 min-w-0 ${emailBoxClass(homeFocus === "emailDomain", domainValid)}`}
              />
              <span className="text-white font-black text-lg select-none">.</span>
              <input
                ref={emailTldRef}
                value={emailTld}
                onChange={e => setEmailTld(e.target.value.replace(/[\s@.]/g, "").toLowerCase())}
                onFocus={() => setHomeFocus("emailTld")}
                maxLength={6}
                placeholder="com"
                autoComplete="off"
                className={`w-14 shrink-0 ${emailBoxClass(homeFocus === "emailTld", tldValid)}`}
              />
            </div>

            {validationMsg && (
              <div className="text-red-300 text-xs font-bold tracking-wide">{validationMsg}</div>
            )}

            <button type="button" onClick={startGame} disabled={!canStart}
              className={["min-w-47.5 rounded-full px-6 py-2.5 font-black text-lg tracking-wider text-white transition-all",
                canStart ? "bg-linear-to-b from-[#ffd246] to-[#ffb700] shadow-[0_6px_0_rgba(0,0,0,0.3)] hover:translate-y-0.5" : "bg-white/10 border-2 border-white/20 opacity-60 cursor-not-allowed"].join(" ")}>
              {!assetsReady ? "LOADING..." : "PLAY"}
            </button>
          </div>
        )}

        {/* GAME OVER */}
        {screen === "over" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center gap-3 px-4 pt-6 pb-5 bg-black/35 backdrop-blur-sm overflow-hidden">
            <div className="text-white font-black text-[44px] leading-none tracking-wider drop-shadow-[0_6px_3px_rgba(0,0,0,0.5)]">GAME OVER</div>

            <div className="w-full max-w-90 flex gap-3">
              <div className="flex-1 rounded-xl bg-black/60 backdrop-blur-sm border-2 border-white/25 p-3 text-center">
                <div className="text-[11px] font-black tracking-wider text-white/90 mb-1">TOTAL</div>
                <div className="text-4xl font-black text-[#ffd246] mb-2">{finalScore}</div>
                <div className="grid gap-1.5 text-[11px] font-black tracking-wider text-white/70">
                  <div className="flex justify-between"><span>PIPES</span><span className="text-white">{Math.max(0, finalScore - finalHat)}</span></div>
                  <div className="flex justify-between"><span>HATS</span><span className="text-white">{finalHat}</span></div>
                </div>
              </div>
              <div className="flex-1 rounded-xl bg-black/60 backdrop-blur-sm border-2 border-white/25 p-3 text-center">
                <div className="text-[11px] font-black tracking-wider text-white/90 mb-1">BEST</div>
                <div className="text-4xl font-black text-[#ffd246]">{best}</div>
                <div className="mt-2 text-[10px] font-black tracking-wider text-white/55">{username}</div>
              </div>
            </div>

            <div className="w-[min(400px,94%)] rounded-xl bg-black/60 backdrop-blur-sm border-2 border-white/25 p-3">
              <div ref={scoreListRef} className={["grid gap-2 max-h-55 overflow-auto rounded-lg transition-all",
                overFocus === "list" ? "ring-2 ring-[#ffd246]" : ""].join(" ")}>
                {topScores.length === 0
                  ? <div className="text-center text-white/70 text-sm py-6">No scores yet.</div>
                  : topScores.slice(0, 8).map((s, i) => (
                    <div key={`${s.timestamp}-${i}`} className="grid grid-cols-[40px_1fr_64px] items-center gap-3 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white">
                      <div className="font-black text-sm">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</div>
                      <div className="truncate text-sm font-semibold">{s.username || "PLAYER"}</div>
                      <div className="text-right font-black text-sm text-[#ffd246]">{s.score}</div>
                    </div>
                  ))
                }
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 w-full max-w-105">
              <button type="button" onClick={startGame}
                className={["min-w-42.5 rounded-full bg-linear-to-b from-[#ffd246] to-[#ffb700] px-6 py-2.5 font-black text-base tracking-wider text-white shadow-[0_6px_0_rgba(0,0,0,0.3)] hover:translate-y-0.5 transition-all",
                  overFocus === "play" ? "ring-2 ring-white scale-105" : ""].join(" ")}>PLAY AGAIN</button>
              <button type="button" onClick={backToMenu}
                className={["min-w-42.5 rounded-full bg-white/10 px-6 py-2.5 font-black text-base tracking-wider text-white border-2 border-white/30 hover:bg-white/15 transition-all",
                  overFocus === "menu" ? "ring-2 ring-[#ffd246] scale-105" : ""].join(" ")}>MENU</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}