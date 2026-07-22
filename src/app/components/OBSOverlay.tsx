import React, { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import FullScreenPlates from "./FullScreenPlates";
import { MatchState } from "../../types";

export type MilestoneType = "FOUR" | "SIX" | "WICKET";

export interface OBSOverlayProps {
  milestone: { type: MilestoneType; message: string } | null;
  m: any; // Mapped UI state from App.tsx
  matchState: MatchState;
  overrideLayout?: string | null;
  isolatedPlate?: string | null;
}

export default function OBSOverlay({ milestone, m, matchState, overrideLayout, isolatedPlate }: OBSOverlayProps) {
  const urlParams = new URLSearchParams(window.location.search);
  const layout = overrideLayout || matchState.activeLayout || urlParams.get("layout") || "lower-third";
  const accentColors: Record<string, string> = { lime: "#C3F400", cyan: "#00E5FF", crimson: "#FF1744", gold: "#FFD700", magenta: "#FF00FF" };
  const rawAccent = matchState.activeAccent || urlParams.get("accent") || "lime";
  const accent = accentColors[rawAccent] || rawAccent;
  const fontFam = matchState.activeFont || urlParams.get("font") || "Inter";

  const FONT_STYLE = { fontFamily: `${fontFam}, "Space Grotesk", sans-serif` };

  const currentTeamName = m.batting === "team_a" ? m.teamA : m.teamB;
  const currentScore = m.batting === "team_a" ? `${m.scoreA}/${m.wktsA}` : `${m.scoreB}/${m.wktsB}`;
  const currentOvers = m.batting === "team_a" ? m.oversA : m.oversB;

  const renderScorebug = () => {
    // Calculate economy rate
    let ec = "0.0";
    if (m.bowler && m.bowler.o) {
      const oversFloat = parseFloat(m.bowler.o);
      if (!isNaN(oversFloat) && oversFloat > 0) {
        const fullOvers = Math.floor(oversFloat);
        const extraBalls = Math.round((oversFloat % 1) * 10);
        const totalBalls = fullOvers * 6 + extraBalls;
        if (totalBalls > 0) ec = ((m.bowler.r / totalBalls) * 6).toFixed(1);
      }
    }

    switch (layout) {
      case "banner":
        return (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div style={{ background: "#0A0F1D", border: "1px solid #1E293B", borderRadius: 8, padding: "8px 24px", color: "#fff", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.4)", ...FONT_STYLE }}>
              <div style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 16, borderRight: "1px solid #1E293B", paddingRight: 16 }}>{m.teamB}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 24, fontWeight: 900 }}>{m.scoreB}-{m.wktsB}</span>
                <span style={{ fontSize: 14, opacity: 0.5, fontFamily: "'JetBrains Mono'" }}>({m.oversB})</span>
              </div>
              {m.target > 0 && (
                <div style={{ background: "#1E293B", color: accent, fontSize: 12, fontWeight: 700, padding: "4px 8px", borderRadius: 4 }}>
                  NEED {m.need} OFF {m.ballsLeft}
                </div>
              )}
            </div>
          </div>
        );

      case "mini":
        return (
          <div className="absolute top-12 left-12 z-20 pointer-events-none">
            <div style={{ background: "#000000", border: `2px solid ${accent}`, borderRadius: 30, padding: "8px 24px", color: "#fff", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.5)", ...FONT_STYLE }}>
              <span style={{ fontWeight: 900, fontSize: 14 }}>{m.teamB}</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: accent }}>{m.scoreB}/{m.wktsB}</span>
              <span style={{ fontSize: 12, opacity: 0.5, fontFamily: "'JetBrains Mono'" }}>({m.oversB})</span>
            </div>
          </div>
        );

      case "sky-sports":
        return (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none w-[90%] max-w-[1600px]">
            <div style={{ width: "100%", background: "#0F172A", borderTop: `4px solid ${accent}`, borderRight: "1px solid #1E293B", borderBottom: "1px solid #1E293B", borderLeft: "1px solid #1E293B", borderRadius: "4px 4px 10px 10px", boxShadow: "0 10px 40px rgba(0,0,0,0.6)", overflow: "hidden", color: "#fff", display: "flex", flexDirection: "column", height: 72, ...FONT_STYLE }}>
              <div style={{ display: "flex", flex: 1, alignItems: "center", padding: "0 16px" }}>
                {m.sponsorLogoUrl && (
                  <div style={{ display: "flex", flexDirection: "column", borderRight: "1px solid #1E293B", paddingRight: 10, marginRight: 10 }}>
                    <span style={{ fontSize: 6, color: "#94a3b8", fontFamily: "'JetBrains Mono'" }}>SPONSORED BY</span>
                    <img src={m.sponsorLogoUrl} alt="sponsor" style={{ height: 18 }} />
                  </div>
                )}
                <div style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 16, letterSpacing: "0.02em" }}>{m.teamB}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginLeft: 16 }}>
                  <span style={{ fontSize: 26, fontWeight: 900, color: accent }}>{m.scoreB}/{m.wktsB}</span>
                  <span style={{ fontSize: 12, opacity: 0.6, fontFamily: "'JetBrains Mono'" }}>OVERS {m.oversB}</span>
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 14, fontSize: 12, opacity: 0.9, justifyContent: "flex-end" }}>
                  <div>{m.striker.name} <span style={{ fontWeight: 800 }}>{m.striker.r}</span> <span style={{ fontSize: 10, color: "#94a3b8" }}>({m.striker.b})</span></div>
                  <div style={{ width: 1, height: 12, background: "#1E293B" }} />
                  <div>{m.nonStr.name} <span style={{ fontWeight: 700, opacity: 0.7 }}>{m.nonStr.r}</span> <span style={{ fontSize: 10, color: "#94a3b8" }}>({m.nonStr.b})</span></div>
                  
                  <div className="flex items-center bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 ml-4">
                    <div className="font-sans font-bold text-white uppercase text-xs tracking-wide mr-4">{m.bowler.name}</div>
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center justify-center border-r border-white/10 pr-3">
                        <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest font-bold">O</span>
                        <span className="text-xs font-mono font-black text-white">{m.bowler.o}</span>
                      </div>
                      <div className="flex flex-col items-center justify-center border-r border-white/10 pr-3">
                        <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest font-bold">R</span>
                        <span className="text-xs font-mono font-black text-white">{m.bowler.r}</span>
                      </div>
                      <div className="flex flex-col items-center justify-center border-r border-white/10 pr-3">
                        <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest font-bold">W</span>
                        <span className="text-xs font-mono font-black" style={{ color: accent }}>{m.bowler.w}</span>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest font-bold">EC</span>
                        <span className="text-xs font-mono font-black text-white">{ec}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ background: "#1E293B", padding: "4px 16px", display: "flex", alignItems: "center", fontSize: 10, fontWeight: 700, color: "#94A3B8", justifyContent: "space-between" }}>
                <span>CRR: {m.crr} &middot; RRR: {m.rrr}</span>
                <span style={{ color: accent }}>{m.target > 0 ? `TARGET: ${m.target} · NEED ${m.need} OFF ${m.ballsLeft} BALLS` : "1ST INNINGS"}</span>
              </div>
            </div>
          </div>
        );

      case "lower-third":
      default:
        return (
          <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
            <div style={{
              background: "rgba(17, 20, 24, 0.95)",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              overflow: "hidden",
              ...FONT_STYLE
            }}>
              {/* Left Accent */}
              <div style={{ width: "8px", background: accent }}></div>
              
              {/* Score Section */}
              <div style={{ display: "flex", alignItems: "center", padding: "16px 24px", gap: "24px", minWidth: "300px" }}>
                <span style={{ color: "#ffffff", fontWeight: 800, fontSize: 24, letterSpacing: "0.05em", textTransform: "uppercase" }}>{currentTeamName}</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <span style={{ color: "#ffffff", fontWeight: 900, fontSize: 36 }}>{currentScore}</span>
                  <span style={{ color: "#94a3b8", fontSize: 16 }}>({currentOvers})</span>
                </div>
              </div>

              {/* Batters Section */}
              <div style={{ display: "flex", alignItems: "center", padding: "16px 32px", borderLeft: "1px solid rgba(255,255,255,0.1)", borderRight: "1px solid rgba(255,255,255,0.1)", flex: 1, color: "#e2e8f0", fontSize: 18 }}>
                <span style={{ fontWeight: 600 }}>{m.striker?.name}</span> <span style={{ marginLeft: 6, fontWeight: 800 }}>{m.striker?.r}*</span><span style={{ fontSize: 14, color: "#94a3b8" }}>({m.striker?.b})</span>
                <span style={{ margin: "0 16px", color: "#64748b" }}>&middot;</span>
                <span>{m.nonStr?.name}</span> <span style={{ marginLeft: 6, fontWeight: 700 }}>{m.nonStr?.r}</span><span style={{ fontSize: 14, color: "#94a3b8" }}>({m.nonStr?.b})</span>
              </div>

              {/* Premium Bowler Section (Tailwind) */}
              <div className="flex items-center px-4 py-3 gap-6 bg-black/40 rounded-lg border border-white/5 ml-auto mr-4 my-2">
                <span className="font-sans font-bold text-white uppercase text-xs tracking-wide">{m.bowler?.name}</span>
                <div className="flex items-center">
                  <div className="flex flex-col items-center px-3 border-r border-white/10">
                    <div className="text-[8px] font-mono text-gray-500 uppercase tracking-widest font-bold">O</div>
                    <div className="text-xs font-mono font-black text-white">{m.bowler?.o}</div>
                  </div>
                  <div className="flex flex-col items-center px-3 border-r border-white/10">
                    <div className="text-[8px] font-mono text-gray-500 uppercase tracking-widest font-bold">R</div>
                    <div className="text-xs font-mono font-black text-white">{m.bowler?.r}</div>
                  </div>
                  <div className="flex flex-col items-center px-3 border-r border-white/10">
                    <div className="text-[8px] font-mono text-gray-500 uppercase tracking-widest font-bold">W</div>
                    <div className="text-xs font-mono font-black" style={{ color: accent }}>{m.bowler?.w}</div>
                  </div>
                  <div className="flex flex-col items-center pl-3">
                    <div className="text-[8px] font-mono text-gray-500 uppercase tracking-widest font-bold">EC</div>
                    <div className="text-xs font-mono font-black text-white">{ec}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Secondary Bar for CRR/Target */}
            <div style={{ background: "rgba(24, 28, 36, 0.95)", padding: "6px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>
              <div>CRR: {m.crr} &middot; RRR: {m.rrr === "Infinity" ? "0.00" : m.rrr}</div>
              <div style={{ color: accent }}>{matchState.currentInnings === 1 ? "1ST INNINGS" : `TARGET: ${m.target}`}</div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden pointer-events-none z-[9999] bg-transparent flex items-center justify-center">
      <div 
        style={{
          width: 1920,
          height: 1080,
          transform: "scale(min(var(--scale-w, 1), var(--scale-h, 1)))",
          transformOrigin: "center center",
          position: "relative"
        }}
        ref={(el) => {
          if (el) {
            const updateScale = () => {
              el.style.setProperty('--scale-w', String(window.innerWidth / 1920));
              el.style.setProperty('--scale-h', String(window.innerHeight / 1080));
            };
            window.addEventListener('resize', updateScale);
            updateScale();
          }
        }}
      >
        {/* Persistent Scorebugs (Hidden if Full-Screen Plate is active OR if isolating a specific plate) */}
        {(!isolatedPlate && (!matchState.activeFullScreenPlate || matchState.activeFullScreenPlate === 'none')) && renderScorebug()}

        {/* Full-Screen Broadcast Plates */}
        {(!isolatedPlate || matchState.activeFullScreenPlate === isolatedPlate) && (
          <FullScreenPlates matchState={matchState} />
        )}

        {/* Dynamic Milestone Animations */}
        <AnimatePresence>
          {milestone && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[100]">
            {milestone.type === "FOUR" && (
              <motion.div
                initial={{ x: "-100vw", opacity: 0, skewX: -15 }}
                animate={{ x: 0, opacity: 1, skewX: -15 }}
                exit={{ x: "100vw", opacity: 0, skewX: -15 }}
                transition={{ duration: 0.3 }}
                className="bg-cyan-500 text-white px-20 py-6 rounded shadow-[0_10px_40px_rgba(6,182,212,0.6)] border-4 border-white/20 flex items-center gap-6"
              >
                <div className="transform -skew-x-15 font-sans flex items-center">
                  <span className="text-6xl font-black italic tracking-wider">CRACKING FOUR!</span>
                  <span className="text-2xl font-bold ml-6 opacity-90">{milestone.message}</span>
                </div>
              </motion.div>
            )}

            {milestone.type === "SIX" && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.0, opacity: 1 }}
                exit={{ scale: 1.1, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-[#c3f400] text-black px-24 py-10 rounded-2xl shadow-[0_0_60px_#c3f400] border-4 border-white text-center"
              >
                <div className="font-sans">
                  <div className="text-7xl font-black tracking-wider leading-none">MAXIMUM SIX!</div>
                  <div className="text-2xl font-bold mt-4 opacity-80">{milestone.message}</div>
                </div>
              </motion.div>
            )}

            {milestone.type === "WICKET" && (
              <motion.div
                initial={{ opacity: 0, scale: 1.2 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ y: "100vh", opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-[#ef4444] text-white px-32 py-8 shadow-[0_0_60px_rgba(239,68,68,0.8)] text-center border-y-8 border-red-400 w-full absolute top-[40%]"
              >
                <div className="font-sans">
                  <motion.div 
                    animate={{ opacity: [1, 0.5, 1] }} 
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="text-7xl font-black tracking-widest uppercase drop-shadow-xl"
                  >
                    WICKET!
                  </motion.div>
                  <div className="text-2xl font-bold mt-4 font-sans">{milestone.message}</div>
                </div>
              </motion.div>
            )}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
