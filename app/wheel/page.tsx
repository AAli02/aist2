"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Config ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "steel-soar-scores-v3";
const SPIN_MS = 6000;
const WHEEL_SIZE = 480;
const COLORS = [
  "#ffaa00", "#e6820a", "#cc6600", "#b34d00", "#994000",
  "#804000", "#663300", "#cc7a00", "#e69500", "#b38600",
  "#996b00", "#806000", "#d4941a", "#bf7300", "#a65c00",
];

type ScoreEntry = { username: string; email: string; score: number; character: number; timestamp: number };
type Phase = "idle" | "countdown" | "wheel" | "spinning" | "winner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadScores(): ScoreEntry[] {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((o): o is Record<string, unknown> => typeof o === "object" && o !== null)
      .map((o) => ({
        username: typeof o.username === "string" ? o.username.slice(0, 12) : "PLAYER",
        email: typeof o.email === "string" ? o.email : "",
        score: typeof o.score === "number" ? o.score : 0,
        character: typeof o.character === "number" ? o.character : 0,
        timestamp: typeof o.timestamp === "number" ? o.timestamp : Date.now(),
      }));
  } catch { return []; }
}

function dedupeByEmail(scores: ScoreEntry[]): ScoreEntry[] {
  const map = new Map<string, ScoreEntry>();
  for (const s of scores) {
    const key = s.email.toLowerCase();
    const existing = map.get(key);
    if (!existing || s.score > existing.score) map.set(key, s);
  }
  return Array.from(map.values()).sort((a, b) => b.score - a.score);
}

// ─── Canvas draw (static at 0° — CSS handles spin) ──────────────────────────

function drawWheel(canvas: HTMLCanvasElement, players: ScoreEntry[], showNames: boolean) {
  const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  canvas.width = Math.floor(WHEEL_SIZE * dpr);
  canvas.height = Math.floor(WHEEL_SIZE * dpr);
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cx = WHEEL_SIZE / 2, cy = WHEEL_SIZE / 2, r = WHEEL_SIZE / 2 - 16;
  const count = players.length;
  const arc = (Math.PI * 2) / count;

  ctx.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE);

  // outer glow ring
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
  ctx.strokeStyle = "#ffaa00";
  ctx.lineWidth = 3;
  ctx.shadowColor = "#ffaa00";
  ctx.shadowBlur = 18;
  ctx.stroke();
  ctx.restore();

  // slices — slice 0 center at top (−90°)
  for (let i = 0; i < count; i++) {
    const start = i * arc - Math.PI / 2;
    const end = start + arc;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.fill();
    ctx.strokeStyle = "#242424";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // label
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

  // center cap
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fillStyle = "#242424";
  ctx.fill();
  ctx.strokeStyle = "#ffaa00";
  ctx.lineWidth = 3;
  ctx.stroke();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WheelPage() {
  const [players, setPlayers] = useState<ScoreEntry[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [duration, setDuration] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [spinDeg, setSpinDeg] = useState(0);
  const [winnerIdx, setWinnerIdx] = useState(-1);
  const [revealed, setRevealed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Data ────────────────────────────────────────────────────────────────

  const refreshData = useCallback(() => {
    setPlayers(dedupeByEmail(loadScores()));
  }, []);

  useEffect(() => {
    refreshData();
    window.addEventListener("storage", refreshData);
    return () => window.removeEventListener("storage", refreshData);
  }, [refreshData]);

  // ── Redraw canvas when players or revealed changes ─────────────────────

  useEffect(() => {
    if (!canvasRef.current || players.length < 2) return;
    drawWheel(canvasRef.current, players, revealed);
  }, [players, revealed, phase]);

  // ── Countdown ──────────────────────────────────────────────────────────

  const startCountdown = useCallback(() => {
    if (players.length < 2) return;
    setPhase("countdown");
    setTimeLeft(duration * 60);
    setRevealed(false);
    setWinnerIdx(-1);
    setSpinDeg(0);
  }, [players.length, duration]);

  useEffect(() => {
    if (phase !== "countdown") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setPhase("wheel");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // ── Escape exits countdown ─────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape" && phase === "countdown") {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase("idle");
        setTimeLeft(0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  // ── Spin ───────────────────────────────────────────────────────────────

  const spinWheel = useCallback(() => {
    if (players.length < 2 || phase !== "wheel") return;
    const count = players.length;
    const sliceAngle = 360 / count;
    const winner = Math.floor(Math.random() * count);
    // rotate clockwise so slice `winner` center lands under pointer (top)
    const targetSlice = winner * sliceAngle + sliceAngle / 2;
    const fullSpins = 360 * (8 + Math.floor(Math.random() * 4));
    const target = fullSpins + targetSlice;

    setWinnerIdx(winner);
    setPhase("spinning");
    requestAnimationFrame(() => requestAnimationFrame(() => setSpinDeg(target)));

    setTimeout(() => {
      setRevealed(true);
      setPhase("winner");
    }, SPIN_MS + 500);
  }, [players, phase]);

  // ── Reset ──────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setPhase("idle");
    setSpinDeg(0);
    setRevealed(false);
    setWinnerIdx(-1);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────

  const timeStr = `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`;

  // fullscreen countdown
  if (phase === "countdown") {
    return (
      <main className="fixed inset-0 z-50 bg-[#242424] grid place-items-center select-none">
        <div className="flex flex-col items-center gap-6">
          <div className="text-[min(12rem,25vw)] font-black text-[#ffaa00] leading-none font-mono tracking-tight drop-shadow-[0_0_40px_rgba(255,170,0,0.3)]">
            {timeStr}
          </div>
          <div className="text-white/40 text-sm font-bold tracking-widest uppercase">Press ESC to exit</div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-[#242424] flex flex-col items-center py-8 px-4 gap-6">
      <h1 className="text-4xl font-black text-[#ffaa00] tracking-wider uppercase">Prize Wheel</h1>

      {/* Controls — idle */}
      {phase === "idle" && (
        <div className="flex flex-col items-center gap-4">
          <button onClick={refreshData} className="px-5 py-2 border-2 border-[#ffaa00] text-[#ffaa00] rounded-xl font-bold tracking-wider hover:bg-[#ffaa00] hover:text-[#242424] transition-all">
            REFRESH ({players.length} players)
          </button>

          <div className="flex gap-2 items-center">
            {[.1, 5, 10, 15, 30].map((m) => (
              <button
                key={m}
                onClick={() => setDuration(m)}
                className={[
                  "px-3 py-2 rounded-lg border-2 font-bold text-sm tracking-wider transition-all",
                  duration === m ? "bg-[#ffaa00] text-[#242424] border-[#ffaa00]" : "border-[#ffaa00]/40 text-[#ffaa00] hover:border-[#ffaa00]",
                ].join(" ")}
              >
                {m}m
              </button>
            ))}
          </div>

          <button
            onClick={startCountdown}
            disabled={players.length < 2}
            className={[
              "min-w-48 rounded-xl px-6 py-3 font-black text-lg tracking-wider transition-all",
              players.length >= 2
                ? "bg-[#ffaa00] text-[#242424] hover:bg-[#ffd246] shadow-[0_6px_0_rgba(0,0,0,0.3)] hover:translate-y-0.5"
                : "bg-white/10 text-white/40 cursor-not-allowed",
            ].join(" ")}
          >
            START COUNTDOWN
          </button>

          {players.length < 2 && <div className="text-red-400/80 text-xs font-bold tracking-wider">Need at least 2 players</div>}
        </div>
      )}

      {/* Wheel */}
      {(phase === "wheel" || phase === "spinning" || phase === "winner") && (
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            {/* pointer triangle */}
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[22px] border-t-[#ffaa00] drop-shadow-[0_0_8px_rgba(255,170,0,0.6)]" />
            <canvas
              ref={canvasRef}
              className="w-[480px] h-[480px] max-w-[90vw] max-h-[90vw]"
              style={{
                transform: `rotate(${spinDeg}deg)`,
                transition: spinDeg > 0 ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.8, 0.18, 1)` : "none",
              }}
            />
          </div>

          {phase === "wheel" && (
            <button onClick={spinWheel} className="min-w-48 rounded-xl bg-[#ffaa00] text-[#242424] px-6 py-3 font-black text-lg tracking-wider shadow-[0_6px_0_rgba(0,0,0,0.3)] hover:translate-y-0.5 hover:bg-[#ffd246] transition-all">
              SPIN
            </button>
          )}

          {phase === "spinning" && (
            <div className="text-white/50 text-sm font-bold tracking-widest animate-pulse uppercase">Spinning...</div>
          )}

          {phase === "winner" && winnerIdx >= 0 && (
            <div className="flex flex-col items-center gap-3">
              <div className="text-white/50 text-sm font-bold tracking-widest uppercase">Winner</div>
              <div className="text-5xl font-black text-[#ffaa00] tracking-wider drop-shadow-[0_0_20px_rgba(255,170,0,0.4)]">
                {players[winnerIdx]?.username || "PLAYER"}
              </div>
              <div className="text-white/40 text-xs font-bold">{players[winnerIdx]?.email}</div>
              <button onClick={reset} className="mt-2 px-6 py-2 rounded-xl border-2 border-[#ffaa00]/40 text-[#ffaa00] font-bold tracking-wider hover:border-[#ffaa00] transition-all">
                RESET
              </button>
            </div>
          )}
        </div>
      )}

      {/* Player list — idle */}
      {phase === "idle" && players.length > 0 && (
        <div className="w-full max-w-md rounded-xl border-2 border-white/15 bg-black/30 p-4">
          <div className="text-white/50 text-xs font-bold tracking-widest mb-3 uppercase">Leaderboard ({players.length})</div>
          <div className="grid gap-1.5 max-h-60 overflow-auto">
            {players.map((p, i) => (
              <div key={`${p.email}-${i}`} className="grid grid-cols-[32px_1fr_52px] items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-white">
                <div className="font-black text-xs text-white/50">{i + 1}.</div>
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