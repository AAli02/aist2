"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useGamepad } from "@/hooks/useGamepad";

const STORAGE_KEY = "steel-soar-scores-v3";
const SPIN_MS = 6000;
const WHEEL_SIZE = 480;
const DURATIONS = [0.1, 5, 10, 15, 30];
const COLORS = [
  "#ffaa00", "#e6820a", "#cc6600", "#b34d00", "#994000",
  "#804000", "#663300", "#cc7a00", "#e69500", "#b38600",
  "#996b00", "#806000", "#d4941a", "#bf7300", "#a65c00",
];

type ScoreEntry = { username: string; email: string; score: number; character: number; timestamp: number };
type Phase = "idle" | "countdown" | "wheel" | "spinning" | "winner";
function loadScores(): ScoreEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((o: Record<string, unknown>) => o && typeof o === "object").map((o: Record<string, unknown>) => ({
      username: typeof o.username === "string" ? o.username.slice(0, 12) : "PLAYER",
      email: String(o.email || ""), score: Number(o.score) || 0,
      character: Number(o.character) || 0, timestamp: Number(o.timestamp) || Date.now(),
    }));
  } catch { return []; }
}

function dedupeByEmail(scores: ScoreEntry[]): ScoreEntry[] {
  const map = new Map<string, ScoreEntry>();
  for (const s of scores) {
    const existing = map.get(s.email.toLowerCase());
    if (!existing || s.score > existing.score) map.set(s.email.toLowerCase(), s);
  }
  return Array.from(map.values()).sort((a, b) => b.score - a.score);
}

function drawWheel(canvas: HTMLCanvasElement, players: ScoreEntry[], showNames: boolean) {
  const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  canvas.width = Math.floor(WHEEL_SIZE * dpr);
  canvas.height = Math.floor(WHEEL_SIZE * dpr);
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cx = WHEEL_SIZE / 2, cy = WHEEL_SIZE / 2, r = WHEEL_SIZE / 2 - 16;
  const count = players.length, arc = (Math.PI * 2) / count;

  ctx.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
  ctx.strokeStyle = "#ffaa00";
  ctx.lineWidth = 3;
  ctx.shadowColor = "#ffaa00";
  ctx.shadowBlur = 18;
  ctx.stroke();
  ctx.restore();

  for (let i = 0; i < count; i++) {
    const start = i * arc - Math.PI / 2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + arc);
    ctx.closePath();
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.fill();
    ctx.strokeStyle = "#242424";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + arc / 2);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${Math.max(10, Math.min(14, 360 / count))}px monospace`;
    ctx.fillStyle = "#242424";
    ctx.fillText(showNames ? players[i].username : "? ? ?", r - 18, 0);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fillStyle = "#242424";
  ctx.fill();
  ctx.strokeStyle = "#ffaa00";
  ctx.lineWidth = 3;
  ctx.stroke();
}
const btn = (base: string, focused: boolean) =>
  `${base} ${focused ? "ring-2 ring-[#ffaa00] ring-offset-2 ring-offset-[#242424]" : ""}`;

const BTN_P = "min-w-48 rounded-xl px-6 py-3 font-black text-lg tracking-wider transition-all bg-[#ffaa00] text-[#242424] hover:bg-[#ffd246] shadow-[0_6px_0_rgba(0,0,0,0.3)] hover:translate-y-0.5";
const BTN_O = "min-w-48 rounded-xl px-6 py-3 font-bold tracking-wider transition-all border-2 border-[#ffaa00] text-[#ffaa00] hover:bg-[#ffaa00] hover:text-[#242424]";
const BTN_G = "px-5 py-2 rounded-xl font-bold tracking-wider transition-all border-2 border-[#ffaa00]/40 text-[#ffaa00] hover:border-[#ffaa00]";
const BTN_D = "min-w-48 rounded-xl px-6 py-3 font-black text-lg tracking-wider bg-white/10 text-white/40 cursor-not-allowed";
export default function WheelPage() {
  const [players, setPlayers] = useState<ScoreEntry[]>(() => dedupeByEmail(loadScores()));
  const [phase, setPhase] = useState<Phase>("idle");
  const [duration, setDuration] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [spinDeg, setSpinDeg] = useState(0);
  const [winnerIdx, setWinnerIdx] = useState(-1);
  const [revealed, setRevealed] = useState(false);
  const [focusIdx, setFocusIdx] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const has = players.length >= 1;
  const setRef = useCallback((i: number) => (el: HTMLButtonElement | null) => { btnRefs.current[i] = el; }, []);

  const setPhaseAndResetFocus = useCallback((p: Phase) => { setPhase(p); setFocusIdx(0); }, []);

  const refreshData = useCallback(() => setPlayers(dedupeByEmail(loadScores())), []);

  useEffect(() => {
    window.addEventListener("storage", refreshData);
    return () => window.removeEventListener("storage", refreshData);
  }, [refreshData]);

  useEffect(() => {
    if (canvasRef.current && has) drawWheel(canvasRef.current, players, revealed);
  }, [players, revealed, phase, has]);
  const startCountdown = useCallback(() => {
    if (!has) return;
    setPhaseAndResetFocus("countdown"); setTimeLeft(duration * 60);
    setRevealed(false); setWinnerIdx(-1); setSpinDeg(0);
  }, [has, duration]);

  useEffect(() => {
    if (phase !== "countdown") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((p) => {
        if (p <= 1) { clearInterval(timerRef.current!); setPhaseAndResetFocus("wheel"); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape" && phase === "countdown") { clearInterval(timerRef.current!); setPhaseAndResetFocus("idle"); setTimeLeft(0); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);
  const reset = useCallback(() => {
    if (phase === "countdown" && timerRef.current) clearInterval(timerRef.current);
    setPhaseAndResetFocus("idle"); setSpinDeg(0); setRevealed(false); setWinnerIdx(-1); setTimeLeft(0);
  }, [phase]);

  const goWheel = useCallback(() => {
    if (!has) return;
    setRevealed(false); setWinnerIdx(-1); setSpinDeg(0); setPhaseAndResetFocus("wheel");
  }, [has]);

  const spinWheel = useCallback(() => {
    if (!has || phase !== "wheel") return;
    const count = players.length, slice = 360 / count;
    const winner = Math.floor(Math.random() * count);
    const land = 360 - (winner * slice + slice * (0.1 + Math.random() * 0.8));
    const target = 360 * (6 + Math.floor(Math.random() * 6)) + land;

    setWinnerIdx(winner);
    setPhaseAndResetFocus("spinning");
    requestAnimationFrame(() => requestAnimationFrame(() => setSpinDeg(target)));
    setTimeout(() => { setRevealed(true); setPhaseAndResetFocus("winner"); }, SPIN_MS + 500);
  }, [players, phase, has]);

  const spinAgain = useCallback(() => {
    setRevealed(false); setWinnerIdx(-1); setSpinDeg(0);
    requestAnimationFrame(() => setPhaseAndResetFocus("wheel"));
  }, []);

  const clearAll = useCallback(() => {
    if (!confirmClear) { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 3000); return; }
    localStorage.removeItem(STORAGE_KEY);
    setPlayers([]); setConfirmClear(false);
  }, [confirmClear]);
  const btnCount = phase === "idle" ? DURATIONS.length + 3 + (players.length > 0 ? 1 : 0)
    : phase === "wheel" || phase === "winner" ? 2 : 0;

  const handleAction = useCallback((action: string) => {
    if (phase === "spinning") return;
    if (phase === "countdown") { if (action === "b") reset(); return; }
    if (!btnCount) return;
    if (action === "dpad-right" || action === "dpad-down") setFocusIdx((p) => Math.min(btnCount - 1, p + 1));
    else if (action === "dpad-left" || action === "dpad-up") setFocusIdx((p) => Math.max(0, p - 1));
    else if (action === "a") { const b = btnRefs.current[focusIdx]; if (b && !b.disabled) b.click(); }
    else if (action === "b" && phase !== "idle") reset();
  }, [phase, btnCount, focusIdx, reset]);

  useGamepad({ onAction: handleAction });
  if (phase === "countdown") {
    const t = `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`;
    return (
      <main className="fixed inset-0 z-50 bg-[#242424] grid place-items-center select-none">
        <div className="flex flex-col items-center gap-6">
          <div className="text-[min(12rem,25vw)] font-black text-[#ffaa00] leading-none font-mono tracking-tight drop-shadow-[0_0_40px_rgba(255,170,0,0.3)]">{t}</div>
          <div className="text-white/40 text-sm font-bold tracking-widest uppercase">Press B or ESC to exit</div>
        </div>
      </main>
    );
  }

  let bi = 0;
  const showWheel = phase === "wheel" || phase === "spinning" || phase === "winner";

  return (
    <main className="w-full min-h-screen bg-[#242424] flex flex-col items-center py-10 px-4 gap-8 select-none">
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-4xl font-black text-[#ffaa00] tracking-wider uppercase">Prize Wheel</h1>
        {phase === "idle" && (
          <div className="text-white/30 text-xs font-bold tracking-widest uppercase">
            {has ? `${players.length} player${players.length > 1 ? "s" : ""} loaded` : "No players yet"}
          </div>
        )}
      </div>

      {phase === "idle" && (
        <div className="flex flex-col items-center gap-5 w-full max-w-md">
          <div className="flex gap-2 items-center">
            {DURATIONS.map((m, i) => (
              <button key={m} ref={setRef(i)} onClick={() => setDuration(m)}
                className={btn(`px-3 py-2 rounded-lg border-2 font-bold text-sm tracking-wider transition-all ${duration === m ? "bg-[#ffaa00] text-[#242424] border-[#ffaa00]" : "border-[#ffaa00]/40 text-[#ffaa00] hover:border-[#ffaa00]"}`, focusIdx === i)}>
                {m}m
              </button>
            ))}
          </div>
          {(() => { bi = DURATIONS.length; return null; })()}
          <div className="flex flex-col items-center gap-3">
            <button ref={setRef(bi)} onClick={startCountdown} disabled={!has} className={btn(has ? BTN_P : BTN_D, focusIdx === bi)}>START COUNTDOWN</button>
            <button ref={setRef(bi + 1)} onClick={goWheel} disabled={!has} className={btn(has ? BTN_O : BTN_D, focusIdx === bi + 1)}>SPIN NOW</button>
          </div>
          <div className="flex gap-3 items-center">
            <button ref={setRef(bi + 2)} onClick={refreshData} className={btn(BTN_G, focusIdx === bi + 2)}>REFRESH</button>
            {players.length > 0 && (
              <button ref={setRef(bi + 3)} onClick={clearAll}
                className={`px-4 py-2 rounded-xl font-bold tracking-wider transition-all border-2 ${confirmClear ? "border-red-400 text-red-400 bg-red-400/10" : "border-red-400/30 text-red-400/80 hover:border-red-400 hover:text-red-400"} ${focusIdx === bi + 3 ? "ring-2 ring-red-400 ring-offset-2 ring-offset-[#242424]" : ""}`}>
                {confirmClear ? "CONFIRM?" : "CLEAR ALL"}
              </button>
            )}
          </div>
        </div>
      )}

      {showWheel && (() => {
        const ai = 0, bk = 1;
        return (
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-14 border-l-transparent border-r-14 border-r-transparent border-t-22 border-t-[#ffaa00] drop-shadow-[0_0_8px_rgba(255,170,0,0.6)]" />
              <canvas ref={canvasRef} className="w-120 h-120 max-w-[90vw] max-h-[90vw]"
                style={{ transform: `rotate(${spinDeg}deg)`, transition: spinDeg > 0 ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.8, 0.18, 1)` : "none" }} />
            </div>
            {phase === "wheel" && (
              <div className="flex gap-3">
                <button ref={setRef(ai)} onClick={spinWheel} className={btn(BTN_P, focusIdx === ai)}>SPIN</button>
                <button ref={setRef(bk)} onClick={reset} className={btn(BTN_G, focusIdx === bk)}>BACK</button>
              </div>
            )}
            {phase === "spinning" && <div className="text-white/50 text-sm font-bold tracking-widest animate-pulse uppercase">Spinning...</div>}
            {phase === "winner" && winnerIdx >= 0 && (
              <div className="flex flex-col items-center gap-4">
                <div className="text-white/40 text-xs font-bold tracking-[0.25em] uppercase">Winner</div>
                <div className="text-5xl font-black text-[#ffaa00] tracking-wider drop-shadow-[0_0_20px_rgba(255,170,0,0.4)]">{players[winnerIdx]?.username || "PLAYER"}</div>
                <div className="text-white/30 text-sm font-bold">{players[winnerIdx]?.email}</div>
                <div className="flex gap-3 mt-2">
                  <button ref={setRef(ai)} onClick={spinAgain} className={btn(BTN_P, focusIdx === ai)}>SPIN AGAIN</button>
                  <button ref={setRef(bk)} onClick={reset} className={btn(BTN_G, focusIdx === bk)}>BACK</button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {phase === "idle" && players.length > 0 && (
        <div className="w-full max-w-md rounded-xl border border-white/10 bg-white/3 p-4">
          <div className="text-white/30 text-xs font-bold tracking-widest uppercase mb-3">Leaderboard</div>
          <div className="grid gap-1.5 max-h-60 overflow-auto">
            {players.map((p, i) => (
              <div key={`${p.email}-${i}`} className="grid grid-cols-[28px_1fr_48px] items-center gap-2 rounded-lg bg-white/5 border border-white/6 px-3 py-1.5 text-white">
                <div className="font-black text-xs text-white/30">{i + 1}</div>
                <div className="truncate text-sm font-bold">{p.username}</div>
                <div className="text-right text-sm font-black text-[#ffaa00]">{p.score}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}