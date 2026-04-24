// "use client";

// import { useCallback, useEffect, useMemo, useState } from "react";

// type VideoItem = {
//   key: string;
//   title: string;
//   src: string;
//   poster?: string;
// };

// const VIDEOS: VideoItem[] = Array.from({ length: 24 }).map((_, i) => {
//   const n = String(i + 1).padStart(2, "0");
//   return {
//     key: `v-${n}`,
//     title: `Video ${n}`,
//     src: `/videos/video-${n}.mp4`,
//     poster: `/videos/posters/video-${n}.jpg`,
//   };
// });

// export default function VideosPage() {
//   const [openKey, setOpenKey] = useState<string | null>(null);

//   const active = useMemo(() => VIDEOS.find((v) => v.key === openKey) ?? null, [openKey]);

//   const close = useCallback(() => setOpenKey(null), []);

//   useEffect(() => {
//     if (!openKey) return;
//     const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [openKey, close]);

//   return (
//     <main className="h-screen w-full overflow-hidden bg-neutral-950">
//       <div className="h-full w-full p-8 sm:p-12">
//         <div className="mx-auto w-full max-w-180">
//           <div className="max-h-[calc(100vh-6rem)] sm:max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
//             <div className="grid grid-cols-2 gap-5 sm:gap-7">
//               {VIDEOS.map((v, idx) => (
//                 <div
//                   key={v.key}
//                   className="relative aspect-3/4 overflow-hidden rounded-2xl border border-white/10 bg-white/5 cursor-pointer"
//                   onClick={() => setOpenKey(v.key)}
//                 >
//                   <video
//                     className="h-full w-full object-cover"
//                     src={v.src}
//                     poster={v.poster}
//                     muted
//                     playsInline
//                     preload="metadata"
//                     onLoadedMetadata={(e) => {
//                       try { e.currentTarget.currentTime = 0.1; } catch {}
//                     }}
//                   />
//                   <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/10 via-transparent to-black/75" />

//                   <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-semibold text-white/80">
//                     {idx + 1}
//                   </div>

//                   <div className="absolute inset-x-0 bottom-0 p-4">
//                     <div className="rounded-xl border border-white/10 bg-black/45 px-3 py-3">
//                       <div className="text-center">
//                         <div className="text-base sm:text-lg font-semibold text-white">{v.title}</div>
//                         <div className="mt-1 text-xs sm:text-sm font-medium text-amber-300/90">Tap to play</div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {active && (
//         <div
//           className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-6 sm:p-10"
//           onClick={close}
//         >
//           <div
//             className="w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-neutral-950"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4">
//               <div className="text-sm sm:text-base font-semibold text-white">{active.title}</div>
//               <button
//                 type="button"
//                 onClick={close}
//                 className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs sm:text-sm font-semibold text-amber-300/90 hover:bg-white/10"
//               >
//                 Close
//               </button>
//             </div>
//             <div className="p-4 sm:p-6">
//               <video
//                 className="w-full rounded-xl bg-black"
//                 src={active.src}
//                 poster={active.poster}
//                 controls
//                 autoPlay
//                 playsInline
//               />
//             </div>
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }