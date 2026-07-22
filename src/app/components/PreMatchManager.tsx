import React, { useState, useEffect } from "react";
import { Sparkles, Check, Users, ShieldAlert, Award, Calendar } from "lucide-react";
import { MatchState } from "../../types";

const WHITE = "#ffffff";

interface PreMatchManagerProps {
  onMatchStart: (data: MatchState) => void;
}

export default function PreMatchManager({ onMatchStart }: PreMatchManagerProps) {
  const [teamAName, setTeamAName] = useState("INDIA");
  const [teamBName, setTeamBName] = useState("AUSTRALIA");
  
  const [squadsA, setSquadsA] = useState<string[]>(Array(15).fill("").map(function(_, i) {
    return i < 4 ? ["V. Kohli", "R. Sharma", "K. Rahul", "H. Pandya"][i] : "";
  }));
  const [squadsB, setSquadsB] = useState<string[]>(Array(15).fill("").map(function(_, i) {
    return i < 4 ? ["D. Warner", "T. Head", "S. Smith", "G. Maxwell"][i] : "";
  }));

  const [teamACaptainIndex, setTeamACaptainIndex] = useState<number | null>(null);
  const [teamAWkIndex, setTeamAWkIndex] = useState<number | null>(null);
  
  const [teamBCaptainIndex, setTeamBCaptainIndex] = useState<number | null>(null);
  const [teamBWkIndex, setTeamBWkIndex] = useState<number | null>(null);

  const [tossWinner, setTossWinner] = useState<"team_a" | "team_b">("team_a");
  const [tossDec, setTossDec] = useState<"bat" | "bowl">("bat");
  const [maxOvers, setMaxOvers] = useState(20);
  const [sponsorUrl, setSponsorUrl] = useState("");

  const [strikerName, setStrikerName] = useState("");
  const [nonStrikerName, setNonStrikerName] = useState("");
  const [bowlerName, setBowlerName] = useState("");

  const isABatting = (tossWinner === "team_a" && tossDec === "bat") || (tossWinner === "team_b" && tossDec === "bowl");
  const battingSquad = isABatting ? squadsA.filter(Boolean) : squadsB.filter(Boolean);
  const bowlingSquad = isABatting ? squadsB.filter(Boolean) : squadsA.filter(Boolean);

  // Automatically update selected batsman and bowler lists when toss decision or rosters change
  useEffect(function() {
    if (battingSquad.length > 0) setStrikerName(battingSquad[0]);
    if (battingSquad.length > 1) setNonStrikerName(battingSquad[1]);
    if (bowlingSquad.length > 0) setBowlerName(bowlingSquad[0]);
  }, [tossWinner, tossDec, squadsA, squadsB]);

  function formatPlayerName(name: string, index: number, captainIdx: number | null, wkIdx: number | null): string {
    if (!name.trim()) return "";
    const isCap = index === captainIdx;
    const isWk = index === wkIdx;
    if (isCap && isWk) return `${name.trim()} (C & WK)`;
    if (isCap) return `${name.trim()} (C)`;
    if (isWk) return `${name.trim()} (WK)`;
    return name.trim();
  }

  async function handleInitialize() {
    try {
      const formattedAPlayers = squadsA.map((name, idx) => formatPlayerName(name, idx, teamACaptainIndex, teamAWkIndex)).filter(Boolean);
      const formattedBPlayers = squadsB.map((name, idx) => formatPlayerName(name, idx, teamBCaptainIndex, teamBWkIndex)).filter(Boolean);

      const strikerIndex = squadsA.indexOf(strikerName) !== -1 ? squadsA.indexOf(strikerName) : squadsB.indexOf(strikerName);
      const strikerIsA = squadsA.indexOf(strikerName) !== -1;
      const formattedStriker = formatPlayerName(strikerName, strikerIndex, strikerIsA ? teamACaptainIndex : teamBCaptainIndex, strikerIsA ? teamAWkIndex : teamBWkIndex);

      const nonStrikerIndex = squadsA.indexOf(nonStrikerName) !== -1 ? squadsA.indexOf(nonStrikerName) : squadsB.indexOf(nonStrikerName);
      const nonStrikerIsA = squadsA.indexOf(nonStrikerName) !== -1;
      const formattedNonStriker = formatPlayerName(nonStrikerName, nonStrikerIndex, nonStrikerIsA ? teamACaptainIndex : teamBCaptainIndex, nonStrikerIsA ? teamAWkIndex : teamBWkIndex);

      const bowlerIndex = squadsA.indexOf(bowlerName) !== -1 ? squadsA.indexOf(bowlerName) : squadsB.indexOf(bowlerName);
      const bowlerIsA = squadsA.indexOf(bowlerName) !== -1;
      const formattedBowler = formatPlayerName(bowlerName, bowlerIndex, bowlerIsA ? teamACaptainIndex : teamBCaptainIndex, bowlerIsA ? teamAWkIndex : teamBWkIndex);

      const res = await fetch("/api/match-state/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamAName,
          teamBName,
          maxOvers,
          tossWinner,
          tossDecidedTo: tossDec,
          inningsType: "1",
          teamAPlayers: formattedAPlayers,
          teamBPlayers: formattedBPlayers,
          sponsorLogoUrl: sponsorUrl.trim() || undefined,
          strikerName: formattedStriker,
          nonStrikerName: formattedNonStriker,
          bowlerName: formattedBowler
        })
      });
      if (res.ok) {
        const data = await res.json();
        onMatchStart(data);
      } else {
        alert("Failed to initialize match on server");
      }
    } catch (err) {
      console.error(err);
      alert("Error initializing match");
    }
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    fontWeight: 700,
    color: "#A1A1AA",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    marginBottom: 4,
    display: "block"
  };

  const inputStyle = (v: string): React.CSSProperties => ({
    flex: 1,
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 13,
    fontFamily: "Inter, sans-serif",
    outline: "none",
    color: "#FFFFFF",
    boxSizing: "border-box",
    textTransform: v.length > 0 ? "uppercase" : "none" as "uppercase" | "none",
    transition: "border-color 0.2s"
  });

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", color: "#ffffff", padding: "24px 16px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 16, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", color: "#c3f400" }}>
              PRE-MATCH CONFIGURATION CENTER
            </h1>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>
              Tournament Directors Operations Panel • CricPulse HD
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(195,244,0,0.08)", padding: "4px 12px", borderRadius: 20, border: "1px solid rgba(195,244,0,0.2)" }}>
            <span style={{ width: 6, height: 6, background: "#c3f400", borderRadius: "50%" }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: "#c3f400" }}>READY TO DEPLOY</span>
          </div>
        </div>

        {/* Bento Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1.2fr", gap: 20, alignItems: "stretch", marginBottom: 24 }}>
          
          {/* Team A Panel */}
          <div style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20, boxShadow: "0 4px 30px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Users size={16} style={{ color: "#c3f400" }} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 800 }}>TEAM A ROSTER</span>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Team Label</label>
              <div style={{ display: "flex", width: "100%" }}>
                <input value={teamAName} onChange={(e) => setTeamAName(e.target.value)} style={inputStyle(teamAName)} placeholder="e.g. INDIA" />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Playing XI Squad</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                {squadsA.slice(0, 11).map((p, i) => {
                  const isCap = teamACaptainIndex === i;
                  const isWk = teamAWkIndex === i;
                  return (
                    <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input value={p} onChange={(e) => {
                        const next = [...squadsA];
                        next[i] = e.target.value;
                        setSquadsA(next);
                      }} style={inputStyle(p)} placeholder={`Player XI #${i+1}`} />
                      
                      {/* Designation buttons */}
                      <button onClick={() => setTeamACaptainIndex(isCap ? null : i)} style={{
                        width: 28, height: 28, borderRadius: 6, border: isCap ? "1px solid #c3f400" : "1px solid rgba(255,255,255,0.1)",
                        background: isCap ? "#c3f400" : "transparent", color: isCap ? "#000000" : "#71717a",
                        fontWeight: 800, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                      }}>C</button>
                      
                      <button onClick={() => setTeamAWkIndex(isWk ? null : i)} style={{
                        width: 28, height: 28, borderRadius: 6, border: isWk ? "1px solid #c380ff" : "1px solid rgba(255,255,255,0.1)",
                        background: isWk ? "#c380ff" : "transparent", color: isWk ? "#000000" : "#71717a",
                        fontWeight: 800, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                      }}>WK</button>
                    </div>
                  );
                })}
              </div>
              
              <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "14px 0" }} />
              
              <label style={labelStyle}>Bench / Extras (4 Substitutes)</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {squadsA.slice(11, 15).map((p, idx) => {
                  const i = idx + 11;
                  return (
                    <div key={i} style={{ display: "flex", width: "100%" }}>
                      <input value={p} onChange={(e) => {
                        const next = [...squadsA];
                        next[i] = e.target.value;
                        setSquadsA(next);
                      }} style={inputStyle(p)} placeholder={`Substitute #${idx+1}`} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Central Match Settings Panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Rules panel */}
            <div style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Award size={16} style={{ color: "#c3f400" }} />
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 800 }}>TOSS &amp; MATCH PARAMETERS</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Toss Winner</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {(["team_a", "team_b"] as const).map((s) => {
                      const active = tossWinner === s;
                      const name = s === "team_a" ? teamAName : teamBName;
                      return (
                        <button key={s} onClick={() => setTossWinner(s)} style={{
                          padding: "10px 0",
                          borderRadius: 8,
                          border: active ? "2px solid #c3f400" : "1px solid rgba(255,255,255,0.1)",
                          background: active ? "rgba(195,244,0,0.1)" : "transparent",
                          color: active ? "#c3f400" : "#A1A1AA",
                          cursor: "pointer",
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontWeight: 700,
                          fontSize: 12,
                          textTransform: "uppercase"
                        }}>
                          {name || `TEAM ${s === "team_a" ? "A" : "B"}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Toss Decision</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {(["bat", "bowl"] as const).map((d) => {
                      const active = tossDec === d;
                      return (
                        <button key={d} onClick={() => setTossDec(d)} style={{
                          padding: "10px 0",
                          borderRadius: 8,
                          border: active ? "2px solid #c3f400" : "1px solid rgba(255,255,255,0.1)",
                          background: active ? "rgba(195,244,0,0.1)" : "transparent",
                          color: active ? "#c3f400" : "#A1A1AA",
                          cursor: "pointer",
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontWeight: 700,
                          fontSize: 12,
                          textTransform: "uppercase"
                        }}>
                          {d === "bat" ? "⚡ ELECT TO BAT" : "🥎 ELECT TO BOWL"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Format (Overs Limit)</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[5, 10, 20, 50].map((o) => {
                      const active = maxOvers === o;
                      return (
                        <button key={o} onClick={() => setMaxOvers(o)} style={{
                          flex: 1,
                          padding: "8px 0",
                          borderRadius: 6,
                          border: active ? "2px solid #c3f400" : "1px solid rgba(255,255,255,0.1)",
                          background: active ? "#c3f400" : "transparent",
                          color: active ? "#09090b" : "#A1A1AA",
                          cursor: "pointer",
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontWeight: 800,
                          fontSize: 13
                        }}>
                          {o}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Sponsor Logo URL</label>
                  <input value={sponsorUrl} onChange={(e) => setSponsorUrl(e.target.value)} style={{ ...inputStyle(sponsorUrl)[0] ? {} : inputStyle(sponsorUrl), textTransform: "none" }} placeholder="https://domain.com/sponsor.png" />
                </div>
              </div>
            </div>

            {/* Lineup configuration card */}
            <div style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Calendar size={15} style={{ color: "#c3f400" }} />
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 800 }}>OPENING LINEUPS</span>
              </div>

              <div>
                <label style={labelStyle}>Striker Batsman</label>
                <select value={strikerName} onChange={(e) => setStrikerName(e.target.value)} style={{ width: "100%", background: "#09090b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 10px", color: WHITE, fontSize: 12 }}>
                  {battingSquad.map((name) => <option key={name} value={name}>{name.toUpperCase()}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Non-Striker Batsman</label>
                <select value={nonStrikerName} onChange={(e) => setNonStrikerName(e.target.value)} style={{ width: "100%", background: "#09090b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 10px", color: WHITE, fontSize: 12 }}>
                  {battingSquad.filter(n => n !== strikerName).map((name) => <option key={name} value={name}>{name.toUpperCase()}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Opening Bowler</label>
                <select value={bowlerName} onChange={(e) => setBowlerName(e.target.value)} style={{ width: "100%", background: "#09090b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 10px", color: WHITE, fontSize: 12 }}>
                  {bowlingSquad.map((name) => <option key={name} value={name}>{name.toUpperCase()}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Team B Panel */}
          <div style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20, boxShadow: "0 4px 30px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Users size={16} style={{ color: "#c3f400" }} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 800 }}>TEAM B ROSTER</span>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Team Label</label>
              <div style={{ display: "flex", width: "100%" }}>
                <input value={teamBName} onChange={(e) => setTeamBName(e.target.value)} style={inputStyle(teamBName)} placeholder="e.g. AUSTRALIA" />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Playing XI Squad</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                {squadsB.slice(0, 11).map((p, i) => {
                  const isCap = teamBCaptainIndex === i;
                  const isWk = teamBWkIndex === i;
                  return (
                    <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input value={p} onChange={(e) => {
                        const next = [...squadsB];
                        next[i] = e.target.value;
                        setSquadsB(next);
                      }} style={inputStyle(p)} placeholder={`Player XI #${i+1}`} />
                      
                      {/* Designation buttons */}
                      <button onClick={() => setTeamBCaptainIndex(isCap ? null : i)} style={{
                        width: 28, height: 28, borderRadius: 6, border: isCap ? "1px solid #c3f400" : "1px solid rgba(255,255,255,0.1)",
                        background: isCap ? "#c3f400" : "transparent", color: isCap ? "#000000" : "#71717a",
                        fontWeight: 800, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                      }}>C</button>
                      
                      <button onClick={() => setTeamBWkIndex(isWk ? null : i)} style={{
                        width: 28, height: 28, borderRadius: 6, border: isWk ? "1px solid #c380ff" : "1px solid rgba(255,255,255,0.1)",
                        background: isWk ? "#c380ff" : "transparent", color: isWk ? "#000000" : "#71717a",
                        fontWeight: 800, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                      }}>WK</button>
                    </div>
                  );
                })}
              </div>
              
              <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "14px 0" }} />
              
              <label style={labelStyle}>Bench / Extras (4 Substitutes)</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {squadsB.slice(11, 15).map((p, idx) => {
                  const i = idx + 11;
                  return (
                    <div key={i} style={{ display: "flex", width: "100%" }}>
                      <input value={p} onChange={(e) => {
                        const next = [...squadsB];
                        next[i] = e.target.value;
                        setSquadsB(next);
                      }} style={inputStyle(p)} placeholder={`Substitute #${idx+1}`} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* Pulse action initialize button */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
          <button onClick={handleInitialize} style={{
            background: "#c3f400",
            color: "#09090b",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 16,
            fontWeight: 900,
            letterSpacing: "0.05em",
            border: "none",
            borderRadius: 12,
            padding: "16px 48px",
            cursor: "pointer",
            boxShadow: "0 0 20px rgba(195,244,0,0.3)",
            animation: "pulse 2s infinite"
          }}>
            INITIALIZE LIVE MATCH
          </button>
        </div>

      </div>

      {/* Pulsing animation styles */}
      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(195, 244, 0, 0.4);
          }
          70% {
            box-shadow: 0 0 0 12px rgba(195, 244, 0, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(195, 244, 0, 0);
          }
        }
      `}</style>
    </div>
  );
}
