import React, { useState, useEffect, useRef } from "react";
import { Activity, Award, Tv, Settings as SettingsIcon, Camera, ArrowLeft, AlertTriangle, Sparkles, Check, Copy, TrendingUp, Flame, Users, Play, X, ChevronDown, Download, Image as ImageIcon, Volume2, Mic, Target, XCircle } from "lucide-react";
import { MatchState, Player, BallEvent, WicketType } from "../types";
import PreMatchManager from "./components/PreMatchManager";
import BroadcastOverlay from "./components/OBSOverlay";
import FullScreenPlates from "./components/FullScreenPlates";
import { motion, AnimatePresence } from "motion/react";

// ─── Colour tokens ───────────────────────────────────────────────────────────
const LIME    = "#C3F400";
const LIME_T  = "#7CB000";
const LIME_DK = "#588C00";
const BG      = "#F7F7F5";
const WHITE   = "#FFFFFF";
const BORDER  = "#E5E5E3";
const TEXT    = "#1A1A1A";
const MUTED   = "#6B7280";
const DANGER  = "#DC2626";
const CARD_SH = "0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px #E5E5E3";

// ─── Font helpers ────────────────────────────────────────────────────────────
const SG:   React.CSSProperties = { fontFamily: "'Space Grotesk', sans-serif" };
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

// ─── Types ───────────────────────────────────────────────────────────────────
type Tab    = "setup" | "admin" | "fan" | "overlay" | "settings" | "camera";
type Step   = 1 | 2 | 3;
type Layout = "lower-third" | "banner" | "mini" | "sky-sports" | "l-band";
type AccentOBS = "lime" | "cyan" | "crimson" | "gold" | "magenta";

// ─── Reusable tiny components ────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: WHITE, borderRadius: 12, boxShadow: CARD_SH, ...style }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ ...MONO, fontSize: 9, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>
      {children}
    </div>
  );
}

function Pill({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span style={{ ...MONO, fontSize: 9, fontWeight: 700, background: bg, color, borderRadius: 99, padding: "2px 8px", letterSpacing: "0.08em", display: "inline-block" }}>
      {children}
    </span>
  );
}

function BallPill({ v, keyVal, key }: { v: string; keyVal?: any; key?: React.Key }) {
  let bg = "#F2F2F0", color = TEXT, border = "1px solid #E5E5E3";
  if (v === "4")  { bg = LIME;    color = "#1A1A1A"; border = "none"; }
  if (v === "6")  { bg = LIME;    color = "#1A1A1A"; border = "none"; }
  if (v === "W")  { bg = DANGER;  color = WHITE;     border = "none"; }
  if (v === "•")  { bg = "#EDEDEB"; color = MUTED;   border = "1px solid #D1D5DB"; }
  if (v === "Wd") { bg = "#FCE7F3"; color = "#BE185D"; border = "1px solid #FBCFE8"; }
  if (v === "Nb") { bg = "#FEF3C7"; color = "#92400E"; border = "1px solid #FDE68A"; }
  return (
    <span key={keyVal} style={{ ...MONO, fontSize: 11, fontWeight: 700, background: bg, color, border, borderRadius: 8, width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      {v}
    </span>
  );
}

function LimeBtn({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <button onClick={onClick} style={{ background: LIME, color: TEXT, border: "none", borderRadius: 8, padding: "10px 18px", ...SG, fontSize: 13, fontWeight: 700, cursor: "pointer", ...style }}>
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <button onClick={onClick} style={{ background: "transparent", color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 18px", ...SG, fontSize: 13, fontWeight: 600, cursor: "pointer", ...style }}>
      {children}
    </button>
  );
}

function DangerBtn({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <button onClick={onClick} style={{ background: DANGER, color: WHITE, border: "none", borderRadius: 8, padding: "10px 18px", ...SG, fontSize: 13, fontWeight: 700, cursor: "pointer", ...style }}>
      {children}
    </button>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: WHITE, borderTop: `1px solid ${BORDER}`, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
      <span style={{ ...MONO, fontSize: 10, color: MUTED }}>© 2026 CricPulse Scorecast Engine • Enterprise Grade</span>
      <span style={{ ...MONO, fontSize: 10, background: "#F2F2F0", color: MUTED, borderRadius: 6, padding: "3px 10px", border: `1px solid ${BORDER}` }}>Created by Zenvor Tech</span>
    </footer>
  );
}

function LiveScreenControlsPanel({ matchState, triggerAction, copiedPlate, handleCopyIsolatedLink }: { matchState: MatchState, triggerAction: any, copiedPlate: string | null, handleCopyIsolatedLink: any }) {
  return (
    <div className="border-t border-slate-200 pt-5 mt-4 flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
        <span className="text-[10px] font-mono font-bold text-slate-500 tracking-widest uppercase">Live Screen Controls</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <button 
            onClick={() => triggerAction('override', { activeFullScreenPlate: matchState.activeFullScreenPlate === 'vs-splash' ? 'none' : 'vs-splash' })}
            className={`w-full flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${matchState.activeFullScreenPlate === 'vs-splash' ? 'bg-[#c3f400]/20 border-[#c3f400] text-black shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
          >
            <Sparkles className={matchState.activeFullScreenPlate === 'vs-splash' ? 'text-black' : 'text-slate-400'} size={24} />
            <span className="font-sans font-bold text-xs">VS Splash</span>
          </button>
          <button 
            onClick={(e) => handleCopyIsolatedLink(e, 'vs-splash')}
            title="Copy Isolated Link"
            className={`absolute top-2 right-2 p-1.5 rounded-lg transition-colors border ${copiedPlate === 'vs-splash' ? 'bg-green-100 border-green-200 text-green-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 border-slate-200'}`}
          >
            {copiedPlate === 'vs-splash' ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>

        <div className="relative">
          <button 
            onClick={() => triggerAction('override', { activeFullScreenPlate: matchState.activeFullScreenPlate === 'playing-xi' ? 'none' : 'playing-xi' })}
            className={`w-full flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${matchState.activeFullScreenPlate === 'playing-xi' ? 'bg-[#c3f400]/20 border-[#c3f400] text-black shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
          >
            <Users className={matchState.activeFullScreenPlate === 'playing-xi' ? 'text-black' : 'text-slate-400'} size={24} />
            <span className="font-sans font-bold text-xs">Playing XI</span>
          </button>
          <button 
            onClick={(e) => handleCopyIsolatedLink(e, 'playing-xi')}
            title="Copy Isolated Link"
            className={`absolute top-2 right-2 p-1.5 rounded-lg transition-colors border ${copiedPlate === 'playing-xi' ? 'bg-green-100 border-green-200 text-green-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 border-slate-200'}`}
          >
            {copiedPlate === 'playing-xi' ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>

        <div className="relative">
          <button 
            onClick={() => triggerAction('override', { activeFullScreenPlate: matchState.activeFullScreenPlate === 'batting-card' ? 'none' : 'batting-card' })}
            className={`w-full flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${matchState.activeFullScreenPlate === 'batting-card' ? 'bg-[#c3f400]/20 border-[#c3f400] text-black shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
          >
            <Flame className={matchState.activeFullScreenPlate === 'batting-card' ? 'text-black' : 'text-slate-400'} size={24} />
            <span className="font-sans font-bold text-xs">Batting Card</span>
          </button>
          <button 
            onClick={(e) => handleCopyIsolatedLink(e, 'batting-card')}
            title="Copy Isolated Link"
            className={`absolute top-2 right-2 p-1.5 rounded-lg transition-colors border ${copiedPlate === 'batting-card' ? 'bg-green-100 border-green-200 text-green-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 border-slate-200'}`}
          >
            {copiedPlate === 'batting-card' ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>

        <div className="relative">
          <button 
            onClick={() => triggerAction('override', { activeFullScreenPlate: matchState.activeFullScreenPlate === 'bowling-card' ? 'none' : 'bowling-card' })}
            className={`w-full flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${matchState.activeFullScreenPlate === 'bowling-card' ? 'bg-[#c3f400]/20 border-[#c3f400] text-black shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
          >
            <Target className={matchState.activeFullScreenPlate === 'bowling-card' ? 'text-black' : 'text-slate-400'} size={24} />
            <span className="font-sans font-bold text-xs">Bowling Card</span>
          </button>
          <button 
            onClick={(e) => handleCopyIsolatedLink(e, 'bowling-card')}
            title="Copy Isolated Link"
            className={`absolute top-2 right-2 p-1.5 rounded-lg transition-colors border ${copiedPlate === 'bowling-card' ? 'bg-green-100 border-green-200 text-green-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 border-slate-200'}`}
          >
            {copiedPlate === 'bowling-card' ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>

        <div className="relative col-span-2">
          <button 
            onClick={() => triggerAction('override', { activeFullScreenPlate: matchState.activeFullScreenPlate === 'match-summary' ? 'none' : 'match-summary' })}
            className={`w-full flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${matchState.activeFullScreenPlate === 'match-summary' ? 'bg-[#c3f400]/20 border-[#c3f400] text-black shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
          >
            <Activity className={matchState.activeFullScreenPlate === 'match-summary' ? 'text-black' : 'text-slate-400'} size={24} />
            <span className="font-sans font-bold text-xs">Match Summary</span>
          </button>
          <button 
            onClick={(e) => handleCopyIsolatedLink(e, 'match-summary')}
            title="Copy Isolated Link"
            className={`absolute top-2 right-2 p-1.5 rounded-lg transition-colors border ${copiedPlate === 'match-summary' ? 'bg-green-100 border-green-200 text-green-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 border-slate-200'}`}
          >
            {copiedPlate === 'match-summary' ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
      </div>

      <button 
        onClick={() => triggerAction('override', { activeFullScreenPlate: 'none' })}
        className={`flex items-center justify-center gap-2 p-3 mt-2 rounded-xl border-2 transition-all ${matchState.activeFullScreenPlate === 'none' || !matchState.activeFullScreenPlate ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-default' : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 shadow-sm'}`}
      >
        <XCircle size={18} />
        <span className="font-sans font-bold text-xs uppercase tracking-wide">Clear Screen (Hide Plate)</span>
      </button>
    </div>
  );
}

// Setup wizard is replaced by PreMatchManager component.

// ─── Screen 2: Admin Desk ─────────────────────────────────────────────────────
function AdminDesk({ m, matchState, triggerAction, onWicket }: { m: any; matchState: MatchState; triggerAction: (ep: string, body?: any) => void; onWicket: () => void }) {
  const [extrasTab, setExtrasTab] = useState<"None"|"Wide"|"No Ball"|"Bye"|"Leg Bye">("None");
  const [newBowler, setNewBowler] = useState("");
  const [newBatter, setNewBatter] = useState("");
  const [customDls, setCustomDls] = useState(String(matchState.dlsTarget || ""));
  const [wheelX, setWheelX] = useState<number | undefined>(undefined);
  const [wheelY, setWheelY] = useState<number | undefined>(undefined);
  const [copiedPlate, setCopiedPlate] = useState<string | null>(null);

  const battingTeam = matchState.battingTeamId === 'team_a' ? matchState.teamA : matchState.teamB;
  const bowlingTeam = matchState.bowlingTeamId === 'team_a' ? matchState.teamA : matchState.teamB;

  function handleBowlerAdd() {
    if (newBowler.trim()) {
      triggerAction('add-bowler', { name: newBowler });
      setNewBowler("");
    }
  }

  function handleBatterAdd() {
    if (newBatter.trim()) {
      triggerAction('add-batter', { name: newBatter, role: 'striker' });
      setNewBatter("");
    }
  }

  function handleWagonClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setWheelX(x);
    setWheelY(y);
  }

  function handleCopyIsolatedLink(e: React.MouseEvent, plateName: string) {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/#pure-overlay?isolate=${plateName}`);
    setCopiedPlate(plateName);
    setTimeout(() => setCopiedPlate(null), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Scoreboard hero */}
      <Card style={{ padding: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 120, height: 120, background: `radial-gradient(circle at top right, rgba(195,244,0,0.12), transparent)`, borderRadius: "0 12px 0 0" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <Pill color={LIME_DK} bg="#F0FFA0">{matchState.isSuperOver ? "SUPER OVER" : "LIVE"}</Pill>
          <Pill color={MUTED} bg="#F2F2F0">{m.maxOvers} OVERS MATCH</Pill>
          {matchState.penaltyRuns && matchState.penaltyRuns > 0 ? (
            <Pill color={WHITE} bg={DANGER}>+{matchState.penaltyRuns} PENALTY RUNS</Pill>
          ) : null}
          {matchState.dlsTarget && (
            <Pill color="#1E40AF" bg="#DBEAFE">DLS TARGET: {matchState.dlsTarget}</Pill>
          )}
        </div>
        <div style={{ ...SG, fontSize: 13, color: MUTED, fontWeight: 600, marginBottom: 4 }}>{m.teamA} vs {m.teamB}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
          <span style={{ ...SG, fontSize: 48, fontWeight: 800, lineHeight: 1 }}>{m.scoreB}/{m.wktsB}</span>
          <span style={{ ...MONO, fontSize: 14, color: MUTED }}>{m.oversB} OV</span>
        </div>
        {/* Chase banner */}
        {m.target > 0 && (
          <div style={{ background: "#FEF9E7", border: "1px solid #FDE68A", borderRadius: 8, padding: "8px 12px", marginBottom: 16, display: "inline-block" }}>
            <span style={{ ...SG, fontSize: 13, fontWeight: 700, color: "#92400E" }}>NEED {m.need} RUNS IN {m.ballsLeft} BALLS (TARGET: {m.target})</span>
          </div>
        )}

        {/* Batters */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          {/* Striker (emphasized) */}
          <div style={{ background: "#F9FFD9", border: `2px solid ${LIME}`, borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ ...MONO, fontSize: 9, color: LIME_T, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>★ STRIKER</div>
            <div style={{ ...SG, fontSize: 15, fontWeight: 800 }}>{m.striker.name}</div>
            <div style={{ ...MONO, fontSize: 11, color: MUTED, marginTop: 2 }}>
              {m.striker.r}({m.striker.b}) &nbsp;·&nbsp; 4s:{m.striker.f} 6s:{m.striker.s}
            </div>
          </div>
          {/* Non-striker (dimmed) */}
          <div style={{ background: "#F2F2F0", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 14px", opacity: 0.75 }}>
            <div style={{ ...MONO, fontSize: 9, color: MUTED, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>NON-STRIKER</div>
            <div style={{ ...SG, fontSize: 15, fontWeight: 800 }}>{m.nonStr.name}</div>
            <div style={{ ...MONO, fontSize: 11, color: MUTED, marginTop: 2 }}>
              {m.nonStr.r}({m.nonStr.b}) &nbsp;·&nbsp; 4s:{m.nonStr.f} 6s:{m.nonStr.s}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <button 
            onClick={function() { triggerAction('override', { strikerId: matchState.nonStrikerId, nonStrikerId: matchState.strikerId }); }} 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 6, 
              background: "#F2F2F0", 
              border: `1px solid ${BORDER}`, 
              borderRadius: 20, 
              padding: "6px 14px", 
              ...MONO, 
              fontSize: 10, 
              fontWeight: 700, 
              cursor: "pointer", 
              color: TEXT, 
              transition: "all 0.15s" 
            }}
          >
            🔄 SWAP BATSMEN STRIKE
          </button>
        </div>

        {/* Bowler */}
        <div style={{ background: "#F5F5F3", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "8px 14px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ ...MONO, fontSize: 9, color: MUTED, textTransform: "uppercase", marginBottom: 2 }}>ACTIVE BOWLER</div>
              <div style={{ ...SG, fontSize: 14, fontWeight: 700 }}>{m.bowler.name}</div>
            </div>
            
            <div className="flex items-center bg-[#0b0e14] rounded-lg border border-white/10 overflow-hidden py-1">
              <div className="px-3 border-r border-white/15">
                <span className="text-[9px] text-gray-500 font-bold font-mono tracking-widest block text-center">O</span>
                <span className="text-sm font-black text-white font-mono text-center block mt-0.5">{m.bowler.o}</span>
              </div>
              <div className="px-3 border-r border-white/15">
                <span className="text-[9px] text-gray-500 font-bold font-mono tracking-widest block text-center">R</span>
                <span className="text-sm font-black text-white font-mono text-center block mt-0.5">{m.bowler.r}</span>
              </div>
              <div className="px-3 border-r border-white/15">
                <span className="text-[9px] text-gray-500 font-bold font-mono tracking-widest block text-center">W</span>
                <span className="text-sm font-black text-[#c3f400] font-mono text-center block mt-0.5">{m.bowler.w}</span>
              </div>
              <div className="px-3">
                <span className="text-[9px] text-gray-500 font-bold font-mono tracking-widest block text-center">E</span>
                <span className="text-sm font-black text-white font-mono text-center block mt-0.5">
                  {(() => {
                    const oStr = m.bowler.o.toString();
                    const full = parseFloat(oStr.split('.')[0] || '0');
                    const extra = parseFloat(oStr.split('.')[1] || '0');
                    const tb = full * 6 + extra;
                    return tb > 0 ? ((m.bowler.r / tb) * 6).toFixed(1) : "0.0";
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ball sequence */}
        <div>
          <SectionLabel>This Over</SectionLabel>
          <div style={{ display: "flex", gap: 6 }}>
            {m.balls.map(function(b: string, i: number) { return <BallPill key={i} keyVal={i} v={b} />; })}
          </div>
        </div>
      </Card>

      {/* Wagon Wheel Panel */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        {/* Wagon Wheel coordinate picker */}
        <Card style={{ padding: 16, display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 400 }}>
          <SectionLabel>Select Wagon Wheel Spot</SectionLabel>
          <div onClick={handleWagonClick} style={{ width: 160, height: 160, borderRadius: "50%", background: "#4ADE80", border: `4px solid #166534`, position: "relative", cursor: "crosshair", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 8 }}>
            {/* Field lines */}
            <div style={{ position: "absolute", width: "100%", height: 2, background: "rgba(255,255,255,0.4)" }} />
            <div style={{ position: "absolute", width: 2, height: "100%", background: "rgba(255,255,255,0.4)" }} />
            {/* Pitch */}
            <div style={{ width: 10, height: 26, background: "#FDE047", border: "1px solid #CA8A04" }} />
            {/* Spot dot */}
            {wheelX !== undefined && wheelY !== undefined && (
              <div style={{ position: "absolute", left: `${wheelX}%`, top: `${wheelY}%`, width: 8, height: 8, background: DANGER, borderRadius: "50%", transform: "translate(-50%, -50%)", border: "2px solid white", boxShadow: "0 0 4px black" }} />
            )}
          </div>
          {wheelX !== undefined && (
            <span style={{ ...MONO, fontSize: 10, color: MUTED, marginTop: 8 }}>Coordinates: X {wheelX}% · Y {wheelY}%</span>
          )}
        </Card>
      </div>

      {/* Live controls */}
      <Card style={{ padding: 20 }}>
        <SectionLabel>Extras Mode</SectionLabel>
        <div style={{ display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap" }}>
          {(["None","Wide","No Ball","Bye","Leg Bye"] as const).map(function(et) {
            const active = extrasTab === et;
            let color = MUTED, bg = "#F2F2F0", aBg = "#F2F2F0", aColor = MUTED;
            if (et === "None")    { aBg = "#E5E5E3"; aColor = TEXT; }
            if (et === "Wide")    { aBg = "#FCE7F3"; aColor = "#BE185D"; }
            if (et === "No Ball") { aBg = "#FEF3C7"; aColor = "#92400E"; }
            if (et === "Bye")     { aBg = "#DBEAFE"; aColor = "#1E40AF"; }
            if (et === "Leg Bye") { aBg = "#F3E8FF"; aColor = "#6D28D9"; }
            return (
              <button key={et} onClick={function() { setExtrasTab(et); }} style={{ ...MONO, fontSize: 10, fontWeight: 700, padding: "6px 10px", borderRadius: 8, border: `1px solid ${BORDER}`, cursor: "pointer", background: active ? aBg : bg, color: active ? aColor : color, whiteSpace: "nowrap" }}>
                {et}
              </button>
            );
          })}
        </div>

        <SectionLabel>Run Actions</SectionLabel>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {["•","1","2","3","4","6"].map(function(r) {
            const runsVal = r === "•" ? 0 : Number(r);
            return (
              <button key={r} onClick={function() {
                const exType = extrasTab === "None" ? "none" : (extrasTab === "No Ball" ? "no_ball" : extrasTab === "Leg Bye" ? "leg_bye" : extrasTab.toLowerCase().replace(" ", "_"));
                const exRuns = (exType === "wide" || exType === "no_ball") ? 1 : 0;
                triggerAction('ball', { runsScored: runsVal, extraType: exType, extraRuns: exRuns, wicketEvent: null, wagonWheelX: wheelX, wagonWheelY: wheelY });
                setExtrasTab("None");
                setWheelX(undefined);
                setWheelY(undefined);
              }} style={{ flex: 1, padding: "12px 0", borderRadius: 8, border: `1px solid ${BORDER}`, background: r === "4" || r === "6" ? LIME : "#F2F2F0", cursor: "pointer", ...SG, fontWeight: 800, fontSize: 16, color: TEXT }}>
                {r}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button onClick={onWicket} style={{ flex: 2, padding: "13px", fontSize: 14, background: DANGER, color: WHITE, border: "none", borderRadius: 8, ...SG, fontWeight: 700, cursor: "pointer" }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><AlertTriangle size={16} /> DISMISSAL / RETIREMENT</span>
          </button>
          <GhostBtn onClick={function() { triggerAction('undo'); }} style={{ flex: 1, padding: "13px", fontSize: 14 }}>
            <span>UNDO BALL</span>
          </GhostBtn>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <button onClick={function() { triggerAction('penalty'); }} style={{ padding: "10px", background: "#FEF3C7", border: "1px solid #F59E0B", color: "#B45309", borderRadius: 8, ...SG, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            ⚡ +5 PENALTY RUNS
          </button>
          <button onClick={function() { triggerAction('super-over'); }} style={{ padding: "10px", background: "#F3E8FF", border: "1px solid #A855F7", color: "#6B21A8", borderRadius: 8, ...SG, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            🥎 INITIATE SUPER OVER
          </button>
        </div>

        {/* Glowing Live Summary Status Capsule */}
        <div style={{ background: "#1A1A1A", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", flexDirection: "column", gap: 4, boxShadow: "0 0 10px rgba(195,244,0,0.1)" }}>
          <span style={{ ...MONO, fontSize: 9, color: MUTED, fontWeight: 700, letterSpacing: "0.1em" }}>CURRENTLY ON PITCH</span>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", ...SG, fontSize: 13, fontWeight: 700 }}>
            <span style={{ color: LIME }}>🏏 Batting: {m.striker.name || "Select"}* &amp; {m.nonStr.name || "Select"} ({battingTeam.name})</span>
            <span style={{ color: DANGER }}>🔴 Bowling: {m.bowler.name || "Select"} ({bowlingTeam.name})</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          <div>
            <SectionLabel>DLS TARGET SET</SectionLabel>
            <input value={customDls} onChange={function(e) {
              setCustomDls(e.target.value);
              triggerAction('override', { dlsTarget: Number(e.target.value) || undefined });
            }} placeholder="e.g. 142" style={{ width: "100%", background: "#F2F2F0", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 10px", fontSize: 12, fontFamily: "Inter,sans-serif", outline: "none", boxSizing: "border-box", color: TEXT }} />
          </div>
          <div>
            <SectionLabel>{bowlingTeam.name} - BOWLING</SectionLabel>
            <select value={matchState.activeBowlerId} onChange={function(e) { triggerAction('override', { activeBowlerId: e.target.value }); }} style={{ width: "100%", background: "#F2F2F0", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 10px", fontSize: 12, fontFamily: "Inter,sans-serif", outline: "none", color: TEXT }}>
              <option value="">Select Current Bowler from {bowlingTeam.name}</option>
              {bowlingTeam.players.map(function(b) { return <option key={b.id} value={b.id}>{b.name}</option>; })}
            </select>
          </div>
          <div>
            <SectionLabel>QUICK-ADD BOWLER</SectionLabel>
            <div style={{ display: "flex", gap: 4 }}>
              <input value={newBowler} onChange={function(e) { setNewBowler(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter') handleBowlerAdd(); }} placeholder={`Type name to add to ${bowlingTeam.name}...`} style={{ flex: 1, background: "#F2F2F0", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 10px", fontSize: 12, fontFamily: "Inter,sans-serif", outline: "none", boxSizing: "border-box", color: TEXT }} />
              <button onClick={handleBowlerAdd} style={{ background: LIME, border: "none", borderRadius: 8, padding: "0 10px", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>+</button>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          <div>
            <SectionLabel>{battingTeam.name} - BATTING</SectionLabel>
            <select value={matchState.strikerId} onChange={function(e) { triggerAction('override', { strikerId: e.target.value }); }} style={{ width: "100%", background: "#F2F2F0", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 10px", fontSize: 12, fontFamily: "Inter,sans-serif", outline: "none", color: TEXT }}>
              <option value="">Select Striker from {battingTeam.name}</option>
              {battingTeam.players.map(function(b) { return <option key={b.id} value={b.id}>{b.name}</option>; })}
            </select>
          </div>
          <div>
            <SectionLabel>Non-Striker Override</SectionLabel>
            <select value={matchState.nonStrikerId} onChange={function(e) { triggerAction('override', { nonStrikerId: e.target.value }); }} style={{ width: "100%", background: "#F2F2F0", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 10px", fontSize: 12, fontFamily: "Inter,sans-serif", outline: "none", color: TEXT }}>
              <option value="">Select Non-Striker from {battingTeam.name}</option>
              {battingTeam.players.map(function(b) { return <option key={b.id} value={b.id}>{b.name}</option>; })}
            </select>
          </div>
          <div>
            <SectionLabel>QUICK-ADD BATTER</SectionLabel>
            <div style={{ display: "flex", gap: 4 }}>
              <input value={newBatter} onChange={function(e) { setNewBatter(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter') handleBatterAdd(); }} placeholder={`Type name to add to ${battingTeam.name}...`} style={{ flex: 1, background: "#F2F2F0", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 10px", fontSize: 12, fontFamily: "Inter,sans-serif", outline: "none", boxSizing: "border-box", color: TEXT }} />
              <button onClick={handleBatterAdd} style={{ background: LIME, border: "none", borderRadius: 8, padding: "0 10px", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>+</button>
            </div>
          </div>
        </div>

        <LiveScreenControlsPanel 
          matchState={matchState} 
          triggerAction={triggerAction} 
          copiedPlate={copiedPlate} 
          handleCopyIsolatedLink={handleCopyIsolatedLink} 
        />

      </Card>
    </div>
  );
}

// ─── Screen 3: Fan Center ─────────────────────────────────────────────────────
function FanCenter({ m, matchState }: { m: any; matchState: MatchState }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Live scoreboard */}
      <Card style={{ padding: 24, background: "#1A1A1A", color: WHITE }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16, justifyContent: "space-between" }}>
          <span style={{ ...MONO, fontSize: 10, color: LIME, fontWeight: 700, letterSpacing: "0.1em" }}>MATCH STATECAST</span>
          <span style={{ ...MONO, fontSize: 10, color: MUTED }}>LIVE POLLING SECURE</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", marginBottom: 8, justifyContent: "space-between" }}>
          <span style={{ ...SG, fontSize: 44, fontWeight: 800 }}>{m.scoreB}/{m.wktsB}</span>
          <span style={{ ...MONO, fontSize: 14, color: MUTED }}>{m.oversB} / {m.maxOvers} OV</span>
        </div>
        <div style={{ ...SG, fontSize: 14, color: WHITE, fontWeight: 700, opacity: 0.85, textTransform: "uppercase", letterSpacing: "0.02em" }}>{m.teamB} INNINGS</div>
        {m.target > 0 && (
          <div style={{ marginTop: 12, ...SG, fontSize: 13, color: LIME, fontWeight: 700 }}>
            NEED {m.need} RUNS OFF {m.ballsLeft} BALLS (RRR: {m.rrr} · CRR: {m.crr})
          </div>
        )}
      </Card>

      {/* Manhattan runs per over graph */}
      <Card style={{ padding: 20 }}>
        <SectionLabel>Manhattan Graph (Runs per Over)</SectionLabel>
        <ManhattanChart maxOvers={m.maxOvers} ballHistory={matchState.ballHistory} />
      </Card>

      {/* Batting Card */}
      <Card style={{ padding: 20 }}>
        <SectionLabel>Batting Scorecard</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", borderBottom: `1px solid ${BORDER}`, paddingBottom: 6, ...MONO, fontSize: 9, fontWeight: 700, color: MUTED }}>
            <span>BATSMAN</span>
            <span>STATUS</span>
            <span style={{ textAlign: "right" }}>R</span>
            <span style={{ textAlign: "right" }}>B</span>
            <span style={{ textAlign: "right" }}>SR</span>
          </div>
          {m.batting.map(function(p: any, i: number) {
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", fontSize: 13, ...SG, fontWeight: p.out ? 500 : 700, color: p.out ? MUTED : TEXT }}>
                <span>{p.name} {!p.out && "★"}</span>
                <span style={{ ...MONO, fontSize: 11, color: MUTED }}>{p.d.toUpperCase()}</span>
                <span style={{ textAlign: "right", fontWeight: 800 }}>{p.r}</span>
                <span style={{ textAlign: "right", color: MUTED }}>{p.b}</span>
                <span style={{ textAlign: "right", ...MONO, fontSize: 11, color: MUTED }}>{p.sr}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Bowling Card */}
      <Card style={{ padding: 20 }}>
        <SectionLabel>Bowling Scorecard</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr 1fr", borderBottom: `1px solid ${BORDER}`, paddingBottom: 6, ...MONO, fontSize: 9, fontWeight: 700, color: MUTED }}>
            <span>BOWLER</span>
            <span style={{ textAlign: "right" }}>O</span>
            <span style={{ textAlign: "right" }}>M</span>
            <span style={{ textAlign: "right" }}>R</span>
            <span style={{ textAlign: "right" }}>W</span>
          </div>
          {m.bowling.map(function(p: any, i: number) {
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr 1fr", fontSize: 13, ...SG, fontWeight: 600 }}>
                <span>{p.name}</span>
                <span style={{ textAlign: "right", ...MONO, fontSize: 11 }}>{p.o}</span>
                <span style={{ textAlign: "right", color: MUTED, ...MONO, fontSize: 11 }}>{p.m}</span>
                <span style={{ textAlign: "right", fontWeight: 700 }}>{p.r}</span>
                <span style={{ textAlign: "right", fontWeight: 800, color: LIME_T }}>{p.w}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─── Manhattan Chart SVG Graphic ──────────────────────────────────────────────
function ManhattanChart({ maxOvers, ballHistory }: { maxOvers: number; ballHistory: BallEvent[] }) {
  const overTotals = Array(maxOvers || 20).fill(0);
  ballHistory.forEach(b => {
    if (b.overNum < overTotals.length) {
      overTotals[b.overNum] += b.totalRunsEvent;
    }
  });

  const maxVal = Math.max(...overTotals, 6);
  const chartHeight = 120;
  const padding = 20;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      <svg viewBox={`0 0 500 ${chartHeight}`} style={{ width: "100%", height: chartHeight, overflow: "visible" }}>
        {/* Draw bars */}
        {overTotals.map((runs, index) => {
          const barWidth = Math.floor(400 / maxOvers);
          const barHeight = runs > 0 ? Math.floor((runs / maxVal) * (chartHeight - padding)) : 2;
          const x = 50 + index * (barWidth + 4);
          const y = chartHeight - padding - barHeight;

          return (
            <g key={index}>
              <rect x={x} y={y} width={barWidth} height={barHeight} fill={runs >= 12 ? "#F59E0B" : LIME} rx={2} />
              {runs > 0 && (
                <text x={x + barWidth / 2} y={y - 4} fill={TEXT} fontSize={9} textAnchor="middle" style={{ ...MONO, fontWeight: 800 }}>{runs}</text>
              )}
              <text x={x + barWidth / 2} y={chartHeight - 4} fill={MUTED} fontSize={8} textAnchor="middle" style={{ ...MONO }}>{index + 1}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", justifyOrdering: "space-between", ...MONO, fontSize: 8, color: MUTED, justifyContent: "space-between" }}>
        <span>Overs timeline (Bars show runs scored in over)</span>
        <span>Peak over: {maxVal} runs</span>
      </div>
    </div>
  );
}

// ─── Screen 4: OBS Overlay Simulator ──────────────────────────────────────────
function OBSOverlay({ m, matchState, triggerAction }: { m: any; matchState: MatchState; triggerAction: (ep: string, body?: any) => void }) {
  const [layout, setLayout] = useState<Layout>((matchState.activeLayout as Layout) || "sky-sports");
  const [accent, setAccent] = useState<AccentOBS>((matchState.activeAccent as AccentOBS) || "lime");
  const [font,   setFont]   = useState(matchState.activeFont || "Space Grotesk");
  const [guides, setGuides] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedPlate, setCopiedPlate] = useState<string | null>(null);

  const accentColors = { lime: LIME, cyan: "#00E5FF", crimson: "#FF1744", gold: "#FFD700", magenta: "#FF00FF" };
  const currentAccentColor = accentColors[accent];

  function copyLink() {
    const url = `${window.location.origin}/#pure-overlay?layout=${layout}&accent=${accent}&font=${encodeURIComponent(font)}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(function() { setCopied(false); }, 1500);
  }

  function handleCopyIsolatedLink(e: React.MouseEvent, plateName: string) {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/#pure-overlay?isolate=${plateName}`);
    setCopiedPlate(plateName);
    setTimeout(() => setCopiedPlate(null), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Simulation Box */}
      <div style={{ position: "relative", overflow: "hidden", background: "#0F172A", border: "1px solid #1E293B", borderRadius: 12, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #1E293B", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
            <span style={{ ...MONO, fontSize: 10, color: "#94A3B8", fontWeight: 700, letterSpacing: "0.08em" }}>OBS RENDER PORTAL (SIMULATION)</span>
          </div>
          <span style={{ ...MONO, fontSize: 9, color: "#64748B", background: "#1E293B", padding: "2px 6px", borderRadius: 4 }}>1920x1080 @ 60FPS</span>
        </div>

        {/* Viewport */}
        <div style={{ height: 320, position: "relative", background: "#1A253C", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", padding: 24, backgroundImage: `radial-gradient(#334155 1px, transparent 1px)`, backgroundSize: "16px 16px" }}>
          {guides && (
            <div style={{ position: "absolute", inset: 0, border: "2px dashed rgba(255,255,255,0.08)", pointerEvents: "none", zIndex: 10 }} />
          )}

          {/* Video Broadcast container (Squeezed down to 80% if L-Band layout is selected) */}
          <div style={{
            position: "absolute",
            transition: "all 0.3s ease-in-out",
            ...(layout === 'l-band' ? {
              top: 10, right: 10, width: "80%", height: "80%", border: "2px solid #334155", background: "#0D1E3D"
            } : {
              top: 0, left: 0, width: "100%", height: "100%"
            }),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.15)",
            ...MONO,
            fontSize: 12
          }}>
            [LIVE VIDEO Broadcaster stream Ingest]
          </div>

          {/* Manhattan overlay inside production */}
          {matchState.showManhattanOverlay && (
            <div style={{ position: "absolute", bottom: 84, right: 24, width: 220, background: "rgba(15,23,42,0.9)", border: "1px solid #334155", padding: 12, borderRadius: 8, zIndex: 30, color: WHITE }}>
              <span style={{ ...MONO, fontSize: 8, color: currentAccentColor, fontWeight: 700 }}>LIVE MANHATTAN WIDGET</span>
              <ManhattanChart maxOvers={m.maxOvers} ballHistory={matchState.ballHistory} />
            </div>
          )}

          {/* Full-Screen Broadcast Plates Simulator */}
          <FullScreenPlates matchState={matchState} />

          {/* LOWER THIRD */}
          {layout === "lower-third" && (
            <div style={{ width: "100%", background: "#0D1117", border: `1px solid ${BORDER}`, borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", display: "flex", overflow: "hidden", color: WHITE, height: 48, fontFamily: font, zIndex: 20 }}>
              <div style={{ background: currentAccentColor, width: 6, height: "100%" }} />
              {m.sponsorLogoUrl && (
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", background: "#161B22", padding: "0 8px", borderRight: "1px solid #21262D" }}>
                  <span style={{ fontSize: 6, color: MUTED, ...MONO }}>SPONSORED BY</span>
                  <img src={m.sponsorLogoUrl} alt="sponsor" style={{ height: 16, width: "auto", objectFit: "contain" }} />
                </div>
              )}
              <div style={{ padding: "0 16px", display: "flex", alignItems: "center", background: "#161B22", fontWeight: 800, textTransform: "uppercase", fontSize: 14 }}>{m.teamB}</div>
              <div style={{ padding: "0 20px", display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 24, fontWeight: 900 }}>{m.scoreB}/{m.wktsB}</span>
                <span style={{ fontSize: 11, opacity: 0.65, fontFamily: "'JetBrains Mono'" }}>({m.oversB})</span>
              </div>
              <div style={{ flex: 1, background: "#0D1117", borderLeft: "1px solid #21262D", display: "flex", alignItems: "center", padding: "0 16px", fontSize: 11, opacity: 0.85 }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <div>{m.striker.name} {m.striker.r}*({m.striker.b})</div>
                  <div>·</div>
                  <div>{m.nonStr.name} {m.nonStr.r}({m.nonStr.b})</div>
                </div>
                
                <div className="flex items-center bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 ml-auto">
                  <div className="font-sans font-bold text-white uppercase text-xs tracking-wide mr-4">
                    {m.bowler.name}
                  </div>
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
                      <span className="text-xs font-mono font-black" style={{ color: currentAccentColor }}>{m.bowler.w}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest font-bold">EC</span>
                      <span className="text-xs font-mono font-black text-white">
                        {(parseFloat(m.bowler.o.toString().split('.')[0] || '0') * 6 + parseFloat(m.bowler.o.toString().split('.')[1] || '0')) > 0 ? (m.bowler.r / ((parseFloat(m.bowler.o.toString().split('.')[0] || '0') * 6 + parseFloat(m.bowler.o.toString().split('.')[1] || '0')) / 6)).toFixed(1) : "0.0"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BANNER LAYOUT */}
          {layout === "banner" && (
            <div style={{ position: "absolute", top: 16, left: 16, background: "#0A0F1D", border: "1px solid #1E293B", borderRadius: 8, padding: "8px 16px", color: WHITE, display: "flex", alignItems: "center", gap: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.4)", fontFamily: font, zIndex: 20 }}>
              <div style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 13, borderRight: "1px solid #1E293B", paddingRight: 10 }}>{m.teamB}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 20, fontWeight: 900 }}>{m.scoreB}-{m.wktsB}</span>
                <span style={{ fontSize: 11, opacity: 0.5, fontFamily: "'JetBrains Mono'" }}>({m.oversB})</span>
              </div>
              {m.target > 0 && (
                <div style={{ background: "#1E293B", color: currentAccentColor, fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>
                  NEED {m.need} OFF {m.ballsLeft}
                </div>
              )}
            </div>
          )}

          {/* SKY SPORTS */}
          {layout === "sky-sports" && (
            <div style={{ width: "100%", background: "#0F172A", borderTop: `4px solid ${currentAccentColor}`, borderRight: "1px solid #1E293B", borderBottom: "1px solid #1E293B", borderLeft: "1px solid #1E293B", borderRadius: "4px 4px 10px 10px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", overflow: "hidden", color: WHITE, display: "flex", flexDirection: "column", height: 72, fontFamily: font, zIndex: 20 }}>
              <div style={{ display: "flex", flex: 1, alignItems: "center", padding: "0 16px" }}>
                {m.sponsorLogoUrl && (
                  <div style={{ display: "flex", flexDirection: "column", borderRight: "1px solid #1E293B", paddingRight: 10, marginRight: 10 }}>
                    <span style={{ fontSize: 6, color: MUTED, ...MONO }}>SPONSORED BY</span>
                    <img src={m.sponsorLogoUrl} alt="sponsor" style={{ height: 18 }} />
                  </div>
                )}
                <div style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 16, letterSpacing: "0.02em" }}>{m.teamB}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginLeft: 16 }}>
                  <span style={{ fontSize: 26, fontWeight: 900, color: currentAccentColor }}>{m.scoreB}/{m.wktsB}</span>
                  <span style={{ fontSize: 12, opacity: 0.6, fontFamily: "'JetBrains Mono'" }}>OVERS {m.oversB}</span>
                </div>
                <div style={{ flex: 1, display: "flex", justifyOrdering: "flex-end", alignItems: "center", gap: 14, fontSize: 12, opacity: 0.9, justifyContent: "flex-end" }}>
                  <div>{m.striker.name} <span style={{ fontWeight: 800 }}>{m.striker.r}</span> <span style={{ fontSize: 10, color: MUTED }}>({m.striker.b})</span></div>
                  <div style={{ width: 1, height: 12, background: "#1E293B" }} />
                  <div>{m.nonStr.name} <span style={{ fontWeight: 700, opacity: 0.7 }}>{m.nonStr.r}</span> <span style={{ fontSize: 10, color: MUTED }}>({m.nonStr.b})</span></div>
                  
                  <div className="flex items-center bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 ml-4">
                    <div className="font-sans font-bold text-white uppercase text-xs tracking-wide mr-4">
                      {m.bowler.name}
                    </div>
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
                        <span className="text-xs font-mono font-black" style={{ color: currentAccentColor }}>{m.bowler.w}</span>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest font-bold">EC</span>
                        <span className="text-xs font-mono font-black text-white">
                          {(parseFloat(m.bowler.o.toString().split('.')[0] || '0') * 6 + parseFloat(m.bowler.o.toString().split('.')[1] || '0')) > 0 ? (m.bowler.r / ((parseFloat(m.bowler.o.toString().split('.')[0] || '0') * 6 + parseFloat(m.bowler.o.toString().split('.')[1] || '0')) / 6)).toFixed(1) : "0.0"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ background: "#1E293B", padding: "4px 16px", display: "flex", alignItems: "center", fontSize: 10, fontWeight: 700, color: "#94A3B8", justifyContent: "space-between" }}>
                <span>CRR: {m.crr} · RRR: {m.rrr}</span>
                <span style={{ color: currentAccentColor }}>{m.target > 0 ? `TARGET: ${m.target} · NEED ${m.need} OFF ${m.ballsLeft} BALLS` : "1ST INNINGS"}</span>
              </div>
            </div>
          )}

          {/* MINI LAYOUT */}
          {layout === "mini" && (
            <div style={{ background: "#000000", border: `2px solid ${currentAccentColor}`, borderRadius: 30, padding: "6px 20px", color: WHITE, display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.5)", fontFamily: font, zIndex: 20 }}>
              <span style={{ fontWeight: 900, fontSize: 12 }}>{m.teamB}</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: currentAccentColor }}>{m.scoreB}/{m.wktsB}</span>
              <span style={{ fontSize: 10, opacity: 0.5, fontFamily: "'JetBrains Mono'" }}>({m.oversB})</span>
            </div>
          )}

          {/* L-BAND (SQUEEZE-BACK) */}
          {layout === "l-band" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", zIndex: 5, pointerEvents: "none", color: WHITE, fontFamily: font }}>
              {/* Left Column Graphic */}
              <div style={{ width: "20%", height: "80%", background: "#0F172A", padding: 12, borderRight: "2px solid #1E293B", display: "flex", flexDirection: "column", gap: 12, boxSizing: "border-box" }}>
                {m.sponsorLogoUrl ? (
                  <div style={{ textAlign: "center" }}>
                    <span style={{ ...MONO, fontSize: 6, color: MUTED }}>SPONSOR BRAND</span>
                    <img src={m.sponsorLogoUrl} alt="sponsor" style={{ width: "100%", maxHeight: 40, objectFit: "contain", marginTop: 4 }} />
                  </div>
                ) : (
                  <div style={{ textAlign: "center", ...MONO, fontSize: 8, color: currentAccentColor }}>CRICPULSE HD</div>
                )}
                <div style={{ borderTop: "1px solid #1E293B", paddingTop: 8 }}>
                  <span style={{ ...MONO, fontSize: 7, color: MUTED }}>BATTING INNINGS</span>
                  <div style={{ ...SG, fontSize: 14, fontWeight: 800 }}>{m.teamB}</div>
                  <div style={{ ...SG, fontSize: 18, fontWeight: 900, color: currentAccentColor }}>{m.scoreB}/{m.wktsB}</div>
                  <div style={{ ...MONO, fontSize: 9 }}>({m.oversB} ov)</div>
                </div>
              </div>
              {/* Bottom Row Scrolling Ticker */}
              <div style={{ height: "20%", width: "100%", background: "#0D1117", borderTop: "2px solid #1E293B", display: "flex", alignItems: "center", padding: "0 16px", boxSizing: "border-box" }}>
                <span style={{ ...MONO, fontSize: 9, background: currentAccentColor, color: TEXT, padding: "2px 6px", borderRadius: 4, marginRight: 12, fontWeight: 800 }}>STATECAST DATA FEED</span>
                <marquee scrollamount="4" style={{ flex: 1, ...SG, fontSize: 12, fontWeight: 600 }}>
                  {m.striker.name} {m.striker.r}({m.striker.b})  ·  {m.nonStr.name} {m.nonStr.r}({m.nonStr.b})  ·  Bowler: {m.bowler.name} {m.bowler.o}-{m.bowler.r}-{m.bowler.w}  ·  CRR {m.crr} {m.target > 0 ? `· Target ${m.target} · Need ${m.need} off ${m.ballsLeft} balls` : ""}
                </marquee>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Options */}
      <Card style={{ padding: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <SectionLabel>OBS Overlay Layout Template</SectionLabel>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {(["sky-sports", "lower-third", "banner", "mini", "l-band"] as const).map(function(l) {
                const active = layout === l;
                return (
                  <button key={l} onClick={function() { setLayout(l); triggerAction('override', { activeLayout: l }); }} style={{ ...MONO, fontSize: 10, fontWeight: 700, padding: "5px 10px", borderRadius: 6, border: `1px solid ${BORDER}`, background: active ? TEXT : "#F2F2F0", color: active ? WHITE : MUTED, cursor: "pointer" }}>
                    {l.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <SectionLabel>Overlay Accent Theme</SectionLabel>
              <div style={{ display: "flex", gap: 6 }}>
                {(["lime", "cyan", "crimson", "gold", "magenta"] as AccentOBS[]).map(function(a) {
                  return (
                    <button key={a} onClick={function() { setAccent(a); triggerAction('override', { activeAccent: a }); }} title={a} style={{ width: 30, height: 30, borderRadius: "50%", background: accentColors[a], border: accent === a ? `3px solid ${TEXT}` : `2px solid ${BORDER}`, cursor: "pointer" }} />
                  );
                })}
              </div>
            </div>

            <div>
              <SectionLabel>Typography font</SectionLabel>
              <div style={{ display: "flex", gap: 4 }}>
                {["Space Grotesk", "JetBrains Mono", "Inter"].map(function(f) {
                  return (
                    <button key={f} onClick={function() { setFont(f); triggerAction('override', { activeFont: f }); }} style={{ ...MONO, fontSize: 10, padding: "6px 10px", borderRadius: 8, border: `1px solid ${BORDER}`, background: font === f ? TEXT : "#F2F2F0", color: font === f ? WHITE : TEXT, cursor: "pointer", fontFamily: f + ", sans-serif" }}>
                      {f.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", borderTop: `1px solid ${BORDER}`, paddingTop: 16, justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: MUTED, ...SG, fontWeight: 600 }}>Show Safe Margin Guides</span>
            <button onClick={function() { setGuides(function(v) { return !v; }); }} style={{ background: guides ? LIME : "#E5E5E3", borderRadius: 20, width: 44, height: 24, border: "none", cursor: "pointer", position: "relative" }}>
              <span style={{ position: "absolute", top: 2, left: guides ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: WHITE, transition: "all 0.15s" }} />
            </button>
          </div>

          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] p-2 rounded leading-tight">
              <strong>Note:</strong> If OBS is running on a different device than your Admin Panel, ensure you access this app via your local network IP (e.g., http://192.168.1.X:3000) before copying this link, otherwise live sync will fail.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={copyLink} style={{ background: copied ? LIME_T : LIME, border: "none", borderRadius: 8, padding: "9px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, ...MONO, fontSize: 11, fontWeight: 700, color: copied ? WHITE : TEXT, whiteSpace: "nowrap", flex: 1, justifyContent: "center" }}>
                <Copy size={12} /> {copied ? "COPIED OBS URL" : "COPY LIVE OBS URL"}
              </button>
            </div>
          </div>

          <LiveScreenControlsPanel 
            matchState={matchState} 
            triggerAction={triggerAction} 
            copiedPlate={copiedPlate} 
            handleCopyIsolatedLink={handleCopyIsolatedLink} 
          />
        </div>
      </Card>
    </div>
  );
}

// ─── Screen 5: Settings Override & Reset Screen ───────────────────────────────
function SettingsScreen({ matchState, triggerAction }: { matchState: MatchState; triggerAction: (ep: string, body?: any) => void }) {
  const [overs, setOvers] = useState(matchState.maxOvers);
  const [tossWin, setTossWin] = useState(matchState.tossWinner === 'team_a' ? "India" : "Australia");
  const [tossDec, setTossDec] = useState(matchState.tossDecidedTo);
  const [activeInn, setActiveInn] = useState(String(matchState.currentInnings));
  const [customTarget, setCustomTarget] = useState(String(matchState.target || ""));
  const [urlCopied, setUrlCopied] = useState(false);
  
  const [matchHistory, setMatchHistory] = useState<MatchState[]>([]);

  useEffect(() => {
    fetch('/api/match-history').then(res => res.json()).then(setMatchHistory).catch(console.error);
  }, []);

  async function archiveMatch() {
    try {
      const res = await fetch('/api/match-state/archive', { method: 'POST' });
      if (res.ok) {
        alert("Match archived successfully! You can now start a new game.");
        fetch('/api/match-history').then(r => r.json()).then(setMatchHistory).catch(console.error);
      }
    } catch (e) {
      console.error(e);
    }
  }

  function copyUrl() {
    navigator.clipboard.writeText(window.location.href);
    setUrlCopied(true);
    setTimeout(function() { setUrlCopied(false); }, 1500);
  }

  return (
    <Card style={{ padding: 24, maxWidth: 560 }}>
      <div style={{ ...SG, fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 20 }}>Match Rules &amp; Toss Options</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <SectionLabel>Innings Overs Cap</SectionLabel>
          <div style={{ display: "flex", gap: 8 }}>
            {[5,10,20,50].map(function(o) {
              return (
                <button key={o} onClick={function() { setOvers(o); }} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: overs === o ? `2px solid ${LIME_T}` : `1px solid ${BORDER}`, background: overs === o ? LIME : "#F2F2F0", cursor: "pointer", ...SG, fontWeight: 800, fontSize: 15, color: overs === o ? TEXT : MUTED }}>
                  {o}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <SectionLabel>Toss Winner Team</SectionLabel>
          <select value={tossWin} onChange={function(e) { setTossWin(e.target.value); }} style={{ width: "100%", background: "#F2F2F0", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, fontFamily: "Inter,sans-serif", outline: "none", color: TEXT }}>
            <option value="India">India</option>
            <option value="Australia">Australia</option>
          </select>
        </div>

        <div>
          <SectionLabel>Toss Decision</SectionLabel>
          <select value={tossDec} onChange={function(e) { setTossDec(e.target.value as any); }} style={{ width: "100%", background: "#F2F2F0", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, fontFamily: "Inter,sans-serif", outline: "none", color: TEXT }}>
            <option value="bat">Elect to Bat First</option>
            <option value="bowl">Elect to Bowl First</option>
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <SectionLabel>Current Innings</SectionLabel>
            <select value={activeInn} onChange={function(e) { setActiveInn(e.target.value); }} style={{ width: "100%", background: "#F2F2F0", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, fontFamily: "Inter,sans-serif", outline: "none", color: TEXT }}>
              <option value="1">1st Innings (Set Target)</option>
              <option value="2">2nd Innings (Chase Target)</option>
            </select>
          </div>
          <div>
            <SectionLabel>Custom Target Runs</SectionLabel>
            <input value={customTarget} onChange={function(e) {
              setCustomTarget(e.target.value);
              triggerAction('override', { target: Number(e.target.value) || 0 });
            }} placeholder="e.g. 188" style={{ width: "100%", background: "#F2F2F0", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, fontFamily: "Inter,sans-serif", outline: "none", boxSizing: "border-box", color: TEXT }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <LimeBtn onClick={archiveMatch} style={{ flex: 1, background: "#3b82f6", color: "#fff" }}>Archive Match</LimeBtn>
          <LimeBtn onClick={function() {
            triggerAction('reset', {
              teamAName: matchState.teamA.name,
              teamBName: matchState.teamB.name,
              maxOvers: overs,
              tossWinner: tossWin.toLowerCase() === 'india' ? 'team_a' : 'team_b',
              tossDecidedTo: tossDec,
              inningsType: activeInn,
              teamAPlayers: matchState.teamA.players.map(p => p.name),
              teamBPlayers: matchState.teamB.players.map(p => p.name)
            });
          }} style={{ flex: 1 }}>Save &amp; Reset Match</LimeBtn>
          <button onClick={copyUrl} style={{ background: urlCopied ? LIME_T : "transparent", color: urlCopied ? WHITE : MUTED, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 18px", ...SG, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {urlCopied ? "URL COPIED!" : "Copy Admin URL"}
          </button>
        </div>

        {matchHistory.length > 0 && (
          <div className="mt-8 border-t border-slate-200 pt-6">
            <div style={{ ...SG, fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Match History Archive</div>
            <div className="flex flex-col gap-3">
              {matchHistory.map((historyMatch, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 text-sm">{historyMatch.teamA.name} vs {historyMatch.teamB.name}</span>
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">Archived</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold">{historyMatch.runs}/{historyMatch.wickets}</span> in {Math.floor(historyMatch.legalBalls / 6)}.{historyMatch.legalBalls % 6} overs
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Screen 6: Local camera WebRTC broadcaster ───────────────────────────────
function CameraBroadcaster() {
  const [facing, setFacing] = useState<"Front" | "Back">("Back");
  const [resolution, setResolution] = useState("720p");
  const [copied, setCopied] = useState(false);
  const [micConnected, setMicConnected] = useState(false);

  function copyUrl() {
    navigator.clipboard.writeText(window.location.href + "?tab=camera");
    setCopied(true);
    setTimeout(function() { setCopied(false); }, 1500);
  }

  return (
    <Card style={{ padding: 24, maxWidth: 560 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <Camera size={18} style={{ color: LIME_T }} />
        <div style={{ ...SG, fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>WebRTC Scorer Camera Node</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ height: 200, background: TEXT, borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: MUTED, ...MONO, fontSize: 12, border: `2px solid ${LIME}`, gap: 12 }}>
          <span>[ZERO-LAG BROADCAST INGEST ACTIVE]</span>
          {micConnected && (
            <span style={{ color: LIME, display: "flex", alignItems: "center", gap: 6 }}><Mic size={14} /> Remote Commentator Audio Live</span>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <SectionLabel>Camera Lens Facing</SectionLabel>
            <div style={{ display: "flex", gap: 6 }}>
              {["Front","Back"].map(function(f) {
                return (
                  <button key={f} onClick={function() { setFacing(f as any); }} style={{ flex: 1, padding: "7px 0", ...MONO, fontSize: 11, fontWeight: 700, borderRadius: 8, border: `1px solid ${BORDER}`, background: facing === f ? TEXT : "#F2F2F0", color: facing === f ? WHITE : MUTED, cursor: "pointer" }}>
                    {f}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <SectionLabel>Video Ingest Resolution</SectionLabel>
            <div style={{ display: "flex", gap: 6 }}>
              {["480p","720p","1080p"].map(function(r) {
                return (
                  <button key={r} onClick={function() { setResolution(r); }} style={{ padding: "7px 8px", ...MONO, fontSize: 10, fontWeight: 700, borderRadius: 8, border: `1px solid ${BORDER}`, background: resolution === r ? LIME : "#F2F2F0", color: resolution === r ? TEXT : MUTED, cursor: "pointer", flex: 1 }}>
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={copyUrl} style={{ flex: 1, background: LIME, border: "none", borderRadius: 8, padding: "10px 18px", ...SG, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {copied ? "COPIED SCORER LINK!" : "Copy Scorer Node Link"}
          </button>
          <button onClick={function() { setMicConnected(!micConnected); }} style={{ border: `1px solid ${BORDER}`, background: micConnected ? "#FCA5A5" : "transparent", borderRadius: 8, padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, ...SG, fontSize: 12, fontWeight: 700 }}>
            <Volume2 size={14} /> {micConnected ? "Disconnect Commentator" : "Connect Commentator"}
          </button>
        </div>
      </div>
    </Card>
  );
}

// ─── Wicket Modal ────────────────────────────────────────────────────────────
function WicketModal({ matchState, onClose, onConfirm }: { matchState: MatchState; onClose: () => void; onConfirm: (type: string, isStriker: boolean, fielder: string) => void }) {
  const [wicketType, setWicketType]   = useState("bowled");
  const [dismissed,  setDismissed]    = useState("Striker");
  const [fielder,    setFielder]      = useState("");
  const types = ["bowled","caught","lbw","stumped","run_out","retired_hurt","retired_out"];

  const battingTeam = matchState.battingTeamId === 'team_a' ? matchState.teamA : matchState.teamB;
  const striker = battingTeam.players.find(p => p.id === matchState.strikerId);
  const nonStriker = battingTeam.players.find(p => p.id === matchState.nonStrikerId);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: WHITE, borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", width: "100%", maxWidth: 440 }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ ...SG, fontSize: 16, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: DANGER }}>DISMISSAL / RETIREMENT DETAILS</div>
          <div style={{ ...MONO, fontSize: 10, color: MUTED, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.1em" }}>CALCULATING IMPACT SCENARIO</div>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <SectionLabel>Wicket / Retirement Type</SectionLabel>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {types.map(function(t) {
                const label = t.replace("_", " ").toUpperCase();
                return (
                  <button key={t} onClick={function() { setWicketType(t); }} style={{ ...MONO, fontSize: 10, fontWeight: 600, padding: "6px 10px", borderRadius: 8, cursor: "pointer", background: wicketType === t ? DANGER : "#F2F2F0", color: wicketType === t ? WHITE : TEXT, border: wicketType === t ? "none" : `1px solid ${BORDER}` }}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <SectionLabel>Player Involved</SectionLabel>
            <div style={{ display: "flex", gap: 6 }}>
              {["Striker","Non-Striker"].map(function(d) {
                const active = dismissed === d;
                const name = d === "Striker" ? (striker?.name || "Striker") : (nonStriker?.name || "Non-Striker");
                return (
                  <button key={d} onClick={function() { setDismissed(d); }} style={{ ...MONO, fontSize: 11, fontWeight: 600, padding: "6px 12px", borderRadius: 8, cursor: "pointer", background: active ? TEXT : "#F2F2F0", color: active ? WHITE : TEXT, border: `1px solid ${BORDER}` }}>
                    {name} ({d.toUpperCase()})
                  </button>
                );
              })}
            </div>
          </div>
          {wicketType !== "retired_hurt" && wicketType !== "retired_out" && (
            <div>
              <SectionLabel>Fielder Involved</SectionLabel>
              <input value={fielder} onChange={function(e) { setFielder(e.target.value); }} placeholder="e.g. Wade, Cummins" style={{ width: "100%", background: "#F2F2F0", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, fontFamily: "Inter,sans-serif", outline: "none", boxSizing: "border-box", color: TEXT }} />
            </div>
          )}
        </div>
        <div style={{ padding: "16px 24px 20px", borderTop: `1px solid ${BORDER}`, display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <button onClick={function() { onConfirm(wicketType, dismissed === "Striker", fielder); onClose(); }} style={{ background: DANGER, color: WHITE, border: "none", borderRadius: 8, padding: "10px 18px", ...SG, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast Banner ────────────────────────────────────────────────────────────
function Toast({ msg, type, onDismiss }: { msg: string; type: string; onDismiss: () => void }) {
  const tagBg = type === "WICKET" ? DANGER : LIME;
  const tagColor = type === "WICKET" ? WHITE : TEXT;
  return (
    <div style={{ position: "sticky", top: 56, zIndex: 100, background: WHITE, borderBottom: `2px solid ${tagBg}`, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ background: tagBg, color: tagColor, ...MONO, fontSize: 9, fontWeight: 700, borderRadius: 6, padding: "2px 8px", textTransform: "uppercase", letterSpacing: "0.1em" }}>{type}</span>
      <span style={{ fontSize: 13, flex: 1, color: TEXT }}>{msg}</span>
      <button onClick={onDismiss} style={{ background: "transparent", border: "none", cursor: "pointer", color: MUTED, display: "flex", alignItems: "center", gap: 4, ...MONO, fontSize: 10, fontWeight: 600 }}>
        DISMISS <X size={12} />
      </button>
    </div>
  );
}

// ─── Global Header ────────────────────────────────────────────────────────────
function Header({ tab, setTab, live, onBack, matchStarted }: { tab: Tab; setTab: (t: Tab) => void; live: boolean; onBack: () => void; matchStarted: boolean }) {
  const tabs: { id: Tab; label: string; short: string }[] = matchStarted ? [
    { id: "setup",    label: "Match Setup",          short: "SETUP" },
    { id: "admin",    label: "Admin scoring Desk",   short: "ADMIN" },
    { id: "fan",      label: "Fan statecast portal", short: "FAN" },
    { id: "overlay",  label: "OBS stream overlay",   short: "OBS" },
    { id: "camera",   label: "Scorer Camera",        short: "CAM" },
    { id: "settings", label: "Settings swap",        short: "SETTINGS" },
  ] : [
    { id: "setup",    label: "Match Setup",          short: "SETUP" }
  ];

  return (
    <header style={{ background: WHITE, borderBottom: `1px solid ${BORDER}`, height: 56, position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px", height: "100%", display: "flex", alignItems: "center", gap: 16, justifyContent: "space-between" }}>
        {/* Left: Brand logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, border: "none", background: "transparent", cursor: "pointer", color: TEXT }}>
            <ArrowLeft size={16} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6, ...SG, fontSize: 15, fontWeight: 800 }}>
            <Activity size={16} style={{ color: LIME_T }} />
            <span>CRICPULSE <span style={{ color: LIME_T }}>HD</span></span>
          </div>
        </div>

        {/* Center: Tabs list */}
        <nav style={{ display: "flex", gap: 2, background: "#F2F2F0", padding: 2, borderRadius: 20, overflowX: "auto" }}>
          {tabs.map(function(t) {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={function() { setTab(t.id); }} style={{ ...MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", whiteSpace: "nowrap", background: active ? LIME : "transparent", color: active ? TEXT : MUTED, transition: "all 0.15s" }}>
                {t.short}
              </button>
            );
          })}
        </nav>

        {/* Live sync */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: live ? "#22C55E" : DANGER, display: "inline-block", boxShadow: live ? "0 0 0 3px rgba(34,197,94,0.25)" : "none" }} />
          <span style={{ ...MONO, fontSize: 10, fontWeight: 700, color: live ? LIME_T : DANGER, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {live ? "LIVE SYNCED" : "OFFLINE"}
          </span>
        </div>
      </div>
    </header>
  );
}

// ─── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,          setTab]          = useState<Tab>("setup");
  const [matchStarted, setMatchStarted] = useState(false);
  const [wicketOpen,   setWicketOpen]   = useState(false);
  const [live,         setLive]         = useState(false);
  const [toast,        setToast]        = useState<{ msg: string; type: string } | null>(null);
  const [history,      setHistory]      = useState<Tab[]>([]);
  const [matchState,   setMatchState]   = useState<MatchState | null>(null);
  const [milestone,    setMilestone]    = useState<{ type: "FOUR" | "SIX" | "WICKET"; message: string } | null>(null);
  const prevStateBallsLength = useRef<number>(0);
  const isInitialMount = useRef<boolean>(true);
  const milestoneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pureOverlayLayout, setPureOverlayLayout] = useState<string | null>(null);
  const [pureOverlayIsolate, setPureOverlayIsolate] = useState<string | null>(null);

  useEffect(function() {
    function handleHashChange() {
      if (window.location.hash.startsWith('#pure-overlay')) {
        const query = window.location.hash.split('?')[1];
        const params = new URLSearchParams(query || "");
        setPureOverlayLayout(params.get('layout') || 'lower-third');
        setPureOverlayIsolate(params.get('isolate'));
      } else {
        setPureOverlayLayout(null);
      }
    }
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return function() { window.removeEventListener('hashchange', handleHashChange); };
  }, []);

  // Hook to monitor ballHistory for Six, Four, and Wickets to trigger 2s overlay animations
  useEffect(function() {
    if (!matchState) return;
    const currentBalls = matchState.ballHistory.length;
    
    if (isInitialMount.current) {
      prevStateBallsLength.current = currentBalls;
      isInitialMount.current = false;
      return;
    }

    const prevBalls = prevStateBallsLength.current;
    prevStateBallsLength.current = currentBalls; // Always track current!

    // If ball count increased, check the latest ball for animation!
    if (currentBalls > prevBalls && currentBalls > 0) {
      const lastBall = matchState.ballHistory[currentBalls - 1];
      let newMilestone: { type: "FOUR" | "SIX" | "WICKET"; message: string } | null = null;
      
      if (lastBall.runsScored === 6) {
        newMilestone = { type: "SIX", message: "MAXIMUM SIX!" };
      } else if (lastBall.runsScored === 4) {
        newMilestone = { type: "FOUR", message: "CRACKING FOUR!" };
      } else if (lastBall.wicketEvent && lastBall.wicketEvent.type !== 'none') {
        const battingTeam = matchState.battingTeamId === 'team_a' ? matchState.teamA : matchState.teamB;
        const player = battingTeam.players.find(p => p.id === lastBall.wicketEvent?.dismissedPlayerId);
        const name = player ? player.name : "Batsman";
        const info = lastBall.wicketEvent.type.replace('_', ' ').toUpperCase();
        newMilestone = { 
          type: "WICKET", 
          message: `${name} (${info})${lastBall.wicketEvent.fielderName ? ` f: ${lastBall.wicketEvent.fielderName}` : ""}` 
        };
      }

      if (newMilestone) {
        setMilestone(newMilestone);
        if (milestoneTimerRef.current) clearTimeout(milestoneTimerRef.current);
        milestoneTimerRef.current = setTimeout(function() { 
          setMilestone(null); 
          milestoneTimerRef.current = null;
        }, 2000);
      }
    }
  }, [matchState?.ballHistory?.length]);

  // SSE with REST polling fallback
  useEffect(function() {
    const SSE_URL  = "/api/match-state/stream";
    const REST_URL = "/api/match-state";
    let es: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    function applyUpdate(data: MatchState) {
      setMatchState(data);
      setLive(true);
      if (data.matchStatus !== 'scheduled') {
        setMatchStarted(true);
      } else {
        setMatchStarted(false);
        setTab("setup");
      }
      
      // Auto toast wicket or milestones
      if (data.showDismissedPlayerOverlay && data.lastDismissedPlayer) {
        setToast({ msg: `${data.lastDismissedPlayer.name} is OUT! ${data.lastDismissedPlayer.dismissalInfo}`, type: "WICKET" });
      }
    }

    async function startPolling() {
      if (pollTimer) return;
      pollTimer = setInterval(async function() {
        try {
          const res = await fetch(REST_URL);
          if (res.ok) {
            const data = await res.json();
            applyUpdate(data);
          } else {
            setLive(false);
          }
        } catch {
          setLive(false);
        }
      }, 1500);
    }

    function stopPolling() {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    }

    try {
      es = new EventSource(SSE_URL);
      es.onmessage = function(e) {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.type === 'INITIAL_STATE' || parsed.type === 'STATE_UPDATE' || parsed.type === 'SCORE_UPDATE') {
            applyUpdate(parsed.data);
          }
        } catch (err) {
          console.error("Error parsing SSE data:", err);
        }
      };
      es.onopen = function() {
        setLive(true);
        stopPolling();
      };
      es.onerror = function() {
        setLive(false);
        startPolling();
      };
    } catch (err) {
      startPolling();
    }

    return function() {
      if (es)        { es.close(); }
      if (pollTimer) { clearInterval(pollTimer); }
    };
  }, []);

  async function triggerAction(endpoint: string, body?: any) {
    try {
      const res = await fetch(`/api/match-state/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      });
      if (res.ok) {
        const updated = await res.json();
        setMatchState(updated);
        if (updated.matchStatus !== 'scheduled') {
          setMatchStarted(true);
        } else {
          setMatchStarted(false);
          setTab("setup");
        }
      } else {
        const err = await res.json();
        alert(`Failed to submit action: ${err.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Failed to perform action:", err);
      alert("Failed to connect to the server.");
    }
  }

  function handleWicketConfirm(type: string, isStriker: boolean, fielder: string) {
    const dismissedId = isStriker ? matchState?.strikerId : matchState?.nonStrikerId;
    
    triggerAction('ball', {
      runsScored: 0,
      extraType: 'none',
      extraRuns: 0,
      wicketEvent: {
        type,
        dismissedPlayerId: dismissedId,
        fielderName: fielder.trim() || undefined
      }
    });
  }

  const fallbacks: Record<Tab, Tab> = { setup: "setup", settings: "admin", camera: "overlay", overlay: "fan", fan: "admin", admin: "admin" };

  function goTo(t: Tab) {
    setHistory(function(h) { return [...h, tab]; });
    setTab(t);
  }

  function goBack() {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(function(h) { return h.slice(0, -1); });
      setTab(prev);
    } else {
      setTab(fallbacks[tab]);
    }
  }

  // Loading indicator until initial match state is fetched
  if (!matchState) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <span style={{ ...MONO, fontSize: 13, color: MUTED }}>CONNECTING STATECAST ENGINE...</span>
        <span style={{ width: 40, height: 4, background: LIME, borderRadius: 2 }} />
      </div>
    );
  }

  // Map backend matchState structure to UI specifications
  const m = mapMatchStateToUI(matchState);

  const isOBSQuery = new URLSearchParams(window.location.search).get("obs") === "true";
  const isOBS = isOBSQuery || pureOverlayLayout !== null;
  if (isOBS) {
    return (
      <>
        <style>{`body, html, #root { background: transparent !important; }`}</style>
        <BroadcastOverlay m={m} matchState={matchState} milestone={milestone} overrideLayout={pureOverlayLayout} isolatedPlate={pureOverlayIsolate} />
      </>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column" }}>
      <EventAnimationOverlay milestone={milestone} />
      <Header tab={tab} setTab={goTo} live={live} onBack={goBack} matchStarted={matchStarted} />

      {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={function() { setToast(null); }} />}

      <main style={{ flex: 1, maxWidth: 900, margin: "0 auto", padding: "20px 16px", width: "100%" }}>
        {tab === "setup"   && <PreMatchManager onMatchStart={function(data) { setMatchState(data); setMatchStarted(true); setTab("admin"); }} />}
        {tab === "admin"   && <AdminDesk m={m} matchState={matchState} triggerAction={triggerAction} onWicket={function() { setWicketOpen(true); }} />}
        {tab === "fan"     && <FanCenter m={m} matchState={matchState} />}
        {tab === "overlay" && <OBSOverlay m={m} matchState={matchState} triggerAction={triggerAction} />}
        {tab === "settings"&& <SettingsScreen matchState={matchState} triggerAction={triggerAction} />}
        {tab === "camera"  && <CameraBroadcaster />}
      </main>

      <Footer />

      {wicketOpen && <WicketModal matchState={matchState} onClose={function() { setWicketOpen(false); }} onConfirm={handleWicketConfirm} />}
    </div>
  );
}

// ─── Mapper Function to translate MatchState type to UI Layout specifications ──
function mapMatchStateToUI(m: MatchState) {
  const battingTeam = m.battingTeamId === 'team_a' ? m.teamA : m.teamB;
  const bowlingTeam = m.bowlingTeamId === 'team_a' ? m.teamA : m.teamB;

  const striker = battingTeam.players.find(p => p.id === m.strikerId) || { name: "Striker", runsScored: 0, ballsFaced: 0, fours: 0, sixes: 0 };
  const nonStr = battingTeam.players.find(p => p.id === m.nonStrikerId) || { name: "Non-Striker", runsScored: 0, ballsFaced: 0, fours: 0, sixes: 0 };
  const bowler = bowlingTeam.players.find(p => p.id === m.activeBowlerId) || { name: "Bowler", ballsBowled: 0, runsConceded: 0, wicketsTaken: 0 };

  const currentOvers = Math.floor(m.legalBalls / 6) + "." + (m.legalBalls % 6);

  // Balls in the current over
  const currentOverNum = Math.floor(m.legalBalls / 6);
  const currentOverBalls = m.ballHistory
    .filter(b => b.overNum === currentOverNum)
    .map(b => {
      if (b.wicketEvent && b.wicketEvent.type !== 'none') {
        if (b.wicketEvent.type === 'retired_hurt') return "RH";
        if (b.wicketEvent.type === 'retired_out') return "RO";
        return "W";
      }
      if (b.extraType === 'wide') return "Wd";
      if (b.extraType === 'no_ball') return "Nb";
      if (b.extraType === 'bye') return "B";
      if (b.extraType === 'leg_bye') return "Lb";
      if (b.runsScored === 0) return "•";
      return String(b.runsScored);
    });

  // Calculate need, ballsLeft, RRR, CRR
  const need = m.target ? Math.max(0, m.target - m.runs) : 0;
  const totalBalls = m.maxOvers * 6;
  const ballsLeft = Math.max(0, totalBalls - m.legalBalls);
  
  const crr = m.legalBalls > 0 ? Number(((m.runs / m.legalBalls) * 6).toFixed(2)) : 0.00;
  const rrr = ballsLeft > 0 ? Number(((need / ballsLeft) * 6).toFixed(2)) : 0.00;

  // Innings totals
  const scoreB = m.runs;
  const wktsB = m.wickets;
  const oversB = currentOvers;

  const scoreA = m.innings1Total ? m.innings1Total.runs : (m.currentInnings === 2 ? 229 : 0);
  const wktsA = m.innings1Total ? m.innings1Total.wickets : (m.currentInnings === 2 ? 6 : 0);
  const oversA = m.innings1Total ? m.innings1Total.oversStr : String(m.maxOvers) + ".0";

  // Batting and Bowling arrays for list
  const batting = battingTeam.players.map(p => ({
    name: p.name,
    d: p.battingStatus === 'active' ? 'not out' : (p.dismissalInfo || 'not batting'),
    r: p.runsScored,
    b: p.ballsFaced,
    f: p.fours,
    s: p.sixes,
    sr: p.ballsFaced > 0 ? ((p.runsScored / p.ballsFaced) * 100).toFixed(1) : "0.0",
    out: p.battingStatus === 'out' || p.battingStatus === 'retired_out'
  }));

  const bowling = bowlingTeam.players.map(p => ({
    name: p.name,
    o: (Math.floor(p.ballsBowled / 6) + "." + (p.ballsBowled % 6)),
    m: 0,
    r: p.runsConceded,
    w: p.wicketsTaken,
    econ: p.ballsBowled > 0 ? ((p.runsConceded / p.ballsBowled) * 6).toFixed(2) : "0.00"
  }));

  // Map fallOfWickets
  const overs = m.fallOfWickets.map(f => ({
    ov: f.wicketNum,
    runs: f.runs,
    wkt: f.wicketNum
  }));

  // Commentary
  const ai = m.commentaryState ? [m.commentaryState] : [
    `${battingTeam.name} is batting at CRR ${crr}.`,
    m.target ? `${battingTeam.name} needs ${need} runs in ${ballsLeft} balls.` : `Target not set yet.`
  ];

  return {
    teamA: m.teamA.name,
    teamB: m.teamB.name,
    scoreA, wktsA, oversA,
    scoreB, wktsB, oversB,
    target: m.target || 0,
    need, ballsLeft,
    crr, rrr,
    maxOvers: m.maxOvers,
    sponsorLogoUrl: m.sponsorLogoUrl,
    striker: { name: striker.name, r: striker.runsScored, b: striker.ballsFaced, f: striker.fours, s: striker.sixes },
    nonStr: { name: nonStr.name, r: nonStr.runsScored, b: nonStr.ballsFaced, f: nonStr.fours, s: nonStr.sixes },
    bowler: { name: bowler.name, o: Math.floor(bowler.ballsBowled / 6) + "." + (bowler.ballsBowled % 6), r: bowler.runsConceded, w: bowler.wicketsTaken },
    balls: currentOverBalls.length > 0 ? currentOverBalls : ["•"],
    batting,
    bowling,
    overs,
    partnership: {
      batter1: striker.name,
      batter2: nonStr.name,
      runs: m.currentPartnership.runs,
      balls: m.currentPartnership.balls
    },
    winProb: 50,
    ai
  };
}

// ─── Event Animation Overlay Component ─────────────────────────────────────────
function EventAnimationOverlay({ milestone }: { milestone: { type: "FOUR" | "SIX" | "WICKET"; message: string } | null }) {
  return (
    <AnimatePresence>
      {milestone && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9999]">
          
          {/* FOUR Animation */}
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

          {/* SIX Animation */}
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

          {/* WICKET Animation */}
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
  );
}
