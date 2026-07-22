import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MatchState } from '../../types';

export interface FullScreenPlatesProps {
  matchState: MatchState;
}

export default function FullScreenPlates({ matchState }: FullScreenPlatesProps) {
  const activePlate = matchState.activeFullScreenPlate || 'none';

  if (activePlate === 'none') return null;

  const teamABatting = matchState.battingTeamId === 'team_a';
  const battingTeam = teamABatting ? matchState.teamA : matchState.teamB;
  const bowlingTeam = teamABatting ? matchState.teamB : matchState.teamA;

  return (
    <AnimatePresence>
      <div className="absolute inset-0 w-full h-full overflow-hidden z-[200] pointer-events-none flex font-sans">
        
        {/* =========================================
            LAYOUT 1: VS SPLASH (Reference 5)
        ========================================= */}
        {activePlate === 'vs-splash' && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0 flex bg-[#0B1B32]" // Deep blue background
          >
            {/* Stadium Lights / Flare Overlay */}
            <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-cyan-400/20 to-transparent" />
            <div className="absolute inset-0 flex justify-between px-20 pt-10 opacity-30">
              <div className="w-64 h-64 bg-white rounded-full blur-[100px]" />
              <div className="w-64 h-64 bg-white rounded-full blur-[100px]" />
            </div>

            {/* Left Team Polygon */}
            <motion.div 
              initial={{ x: "-100%" }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 60, damping: 20 }}
              className="absolute top-[20%] bottom-[20%] left-0 w-[55%] bg-gradient-to-br from-blue-800 to-blue-950 border-r-8 border-white shadow-[10px_0_40px_rgba(0,0,0,0.5)]"
              style={{ clipPath: 'polygon(0 0, 85% 0, 100% 100%, 0 100%)' }}
            >
              <div className="absolute right-[20%] top-1/2 -translate-y-1/2">
                <div className="text-7xl font-black text-white uppercase tracking-tighter drop-shadow-2xl">{matchState.teamA.name}</div>
              </div>
            </motion.div>
            
            {/* Right Team Polygon */}
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 60, damping: 20 }}
              className="absolute top-[20%] bottom-[20%] right-0 w-[55%] bg-gradient-to-bl from-green-700 to-emerald-950 border-l-8 border-white shadow-[-10px_0_40px_rgba(0,0,0,0.5)]"
              style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)' }}
            >
              <div className="absolute left-[20%] top-1/2 -translate-y-1/2">
                <div className="text-7xl font-black text-white uppercase tracking-tighter drop-shadow-2xl">{matchState.teamB.name}</div>
              </div>
            </motion.div>

            {/* Center VS Emblem */}
            <motion.div 
              initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.3 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="bg-gradient-to-br from-yellow-300 via-yellow-600 to-yellow-800 rounded-full w-40 h-40 p-2 shadow-[0_0_50px_rgba(234,179,8,0.6)]">
                <div className="w-full h-full bg-black rounded-full flex items-center justify-center border-2 border-yellow-500/50">
                  <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 italic tracking-widest" style={{ fontFamily: "serif" }}>VS</span>
                </div>
              </div>
            </motion.div>

            {/* Bottom Match Info Footer */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
              className="absolute bottom-16 left-0 right-0 flex flex-col items-center"
            >
              <div className="text-4xl text-white font-bold tracking-widest uppercase mb-2 drop-shadow-md">
                T20 CHAMPIONSHIP, 2026
              </div>
              <div className="text-xl text-slate-300 font-medium uppercase tracking-widest">
                LIVE · {matchState.venue || "THE STADIUM"}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* =========================================
            LAYOUT 2: PLAYING XI (Reference 3)
        ========================================= */}
        {activePlate === 'playing-xi' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
            className="absolute inset-0 flex bg-[#0A0524]" // Deep purple background
          >
            {/* Pink Accent Shapes */}
            <div className="absolute top-0 right-0 w-[800px] h-screen bg-gradient-to-l from-fuchsia-900/40 to-transparent" style={{ clipPath: "polygon(20% 0, 100% 0, 100% 100%, 0% 100%)" }} />

            <div className="flex h-full w-full pl-32 py-16">
              {/* Left Column: Graphic & Text */}
              <div className="w-[550px] flex flex-col">
                
                {/* Large "PLAYING XI" Graphic */}
                <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="mb-6 flex">
                  <div className="text-transparent font-black leading-none" style={{ WebkitTextStroke: "2px #8B5CF6", fontSize: "140px" }}>XI</div>
                  <div className="flex flex-col justify-center ml-4 mt-8">
                    <span className="text-purple-500 font-black tracking-[0.3em] text-3xl">PLAYING</span>
                    <div className="flex items-center gap-3 mt-4 bg-white/10 p-2 rounded w-max border border-white/20">
                      <span className="text-white font-bold uppercase">{matchState.teamA.name.slice(0,3)}</span>
                      <span className="text-white/50 text-xs">V</span>
                      <span className="text-white font-bold uppercase">{matchState.teamB.name.slice(0,3)}</span>
                      <span className="bg-black/50 text-white text-xs px-2 py-1 ml-2">MATCH 22</span>
                    </div>
                  </div>
                </motion.div>

                {/* Toss Decision Banner */}
                <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-purple-600 text-white font-bold px-4 py-2 text-xl w-max rounded-sm uppercase tracking-wide mb-8">
                  {matchState.tossWinner === battingTeam.id ? battingTeam.name : bowlingTeam.name} OPT TO {matchState.tossDecidedTo}
                </motion.div>
                
                {/* Player List */}
                <div className="flex flex-col gap-3">
                  {battingTeam.players.slice(0, 11).map((player, idx) => (
                    <motion.div 
                      initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 + (idx * 0.05) }}
                      key={player.id} className="flex items-center gap-3"
                    >
                      <span className="text-white font-bold text-2xl uppercase tracking-wide">{player.name}</span>
                      {idx === 0 && <span className="text-red-500 font-black text-lg">(C)</span>}
                      {idx === 1 && <span className="text-pink-500 font-black text-lg">(W)</span>}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right Column: Player Render Area (Placeholder) */}
              <div className="flex-1 relative">
                 <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center h-[800px] w-32 border-l border-white/10 opacity-30">
                    <span style={{ writingMode: 'vertical-rl' }} className="text-white tracking-[0.5em] text-xl font-bold uppercase">T20 WORLD CUP 2026</span>
                 </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* =========================================
            LAYOUT 2.5: BATTING CARD
        ========================================= */}
        {activePlate === 'batting-card' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=3567&auto=format&fit=crop')] bg-cover bg-center"
          >
            {/* Translucent overlay for stadium background */}
            <div className="absolute inset-0 bg-emerald-900/70 backdrop-blur-sm" />

            {/* Skewed Container */}
            <motion.div 
              initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 80, damping: 20 }}
              className="relative w-[1200px]"
            >
              {/* Giant backdrop shape with skewed edges */}
              <div className="absolute inset-0 -skew-x-[12deg] bg-gradient-to-b from-emerald-100 via-emerald-600 to-emerald-900 border-4 border-emerald-300 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
                 <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-yellow-500/40 rounded-full blur-3xl mix-blend-overlay" />
                 <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-400/40 rounded-full blur-3xl mix-blend-overlay" />
              </div>

              {/* Unskewed Content Wrapper */}
              <div className="relative p-10 font-sans">
                
                {/* Header block */}
                <div className="flex flex-col items-center mb-6 drop-shadow-md">
                  <div className="text-white text-5xl font-black uppercase tracking-tighter shadow-black/50">QUARTER FINAL</div>
                  <div className="text-emerald-200 text-sm font-bold tracking-widest uppercase">{matchState.venue || "ADELAIDE OVAL"}</div>
                </div>

                {/* Team Banner */}
                <div className="bg-white px-8 py-3 rounded shadow-inner flex items-center justify-between mb-2">
                  <div className="text-emerald-900 font-black text-3xl uppercase tracking-tighter flex gap-2">
                    {matchState.teamA.name} <span className="text-slate-400 font-normal text-xl mt-1">v</span> {matchState.teamB.name}
                  </div>
                  <div className="text-slate-400 font-bold text-xs">STAR SPORTS LIVE</div>
                </div>

                {/* Main Stats Table */}
                <div className="bg-emerald-900/80 backdrop-blur-md px-8 py-6 mb-2">
                  <table className="w-full text-left text-white border-collapse">
                    <thead>
                      <tr>
                        <th className="pb-4 border-b border-emerald-400/30 text-xs font-bold uppercase tracking-widest">Batter</th>
                        <th className="pb-4 border-b border-emerald-400/30 text-xs font-bold uppercase tracking-widest text-center">Status</th>
                        <th className="pb-4 border-b border-emerald-400/30 text-xs font-bold uppercase tracking-widest text-center">Runs</th>
                        <th className="pb-4 border-b border-emerald-400/30 text-xs font-bold uppercase tracking-widest text-center">Balls</th>
                        <th className="pb-4 border-b border-emerald-400/30 text-xs font-bold uppercase tracking-widest text-center">4s</th>
                        <th className="pb-4 border-b border-emerald-400/30 text-xs font-bold uppercase tracking-widest text-center">6s</th>
                        <th className="pb-4 border-b border-emerald-400/30 text-xs font-bold uppercase tracking-widest text-center">SR</th>
                      </tr>
                    </thead>
                    <tbody className="font-bold text-lg">
                      {battingTeam.players.filter(p => p.ballsFaced > 0 || (p.id === matchState.strikerId || p.id === matchState.nonStrikerId)).map((player) => {
                        const sr = player.ballsFaced > 0 ? ((player.runsScored / player.ballsFaced) * 100).toFixed(1) : "0.0";
                        const isNotOut = player.id === matchState.strikerId || player.id === matchState.nonStrikerId;
                        return (
                          <tr key={player.id} className="border-b border-emerald-400/10 hover:bg-white/5 transition-colors">
                            <td className="py-3 uppercase tracking-wide">
                              {player.name} {isNotOut && <span className="text-emerald-300 ml-1 text-sm">*</span>}
                            </td>
                            <td className="py-3 text-center text-sm font-normal text-emerald-200">
                              {isNotOut ? "not out" : (player.dismissalInfo || "out")}
                            </td>
                            <td className="py-3 text-center text-white">{player.runsScored}</td>
                            <td className="py-3 text-center text-emerald-200">{player.ballsFaced}</td>
                            <td className="py-3 text-center text-emerald-200">{player.fours}</td>
                            <td className="py-3 text-center text-emerald-200">{player.sixes}</td>
                            <td className="py-3 text-center text-[#c3f400]">{sr}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer block */}
                <div className="flex justify-between items-end mt-4">
                  <div className="bg-emerald-950/80 px-6 py-3 border border-emerald-500/30 rounded flex items-center gap-4">
                    <span className="text-emerald-300 text-[10px] uppercase font-bold tracking-widest">Team Total</span>
                    <span className="text-white text-3xl font-black">{matchState.runs}/{matchState.wickets}</span>
                  </div>
                  <div className="bg-[#c3f400] text-black px-6 py-3 font-black text-2xl uppercase tracking-tighter skew-x-[-12deg] shadow-lg">
                    <div className="skew-x-[12deg]">Batting Card</div>
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}

        {/* =========================================
            LAYOUT 3: BOWLING CARD (Reference 1)
        ========================================= */}
        {activePlate === 'bowling-card' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=3567&auto=format&fit=crop')] bg-cover bg-center"
          >
            {/* Translucent overlay for stadium background */}
            <div className="absolute inset-0 bg-blue-900/60 backdrop-blur-sm" />

            {/* Skewed Container */}
            <motion.div 
              initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 80, damping: 20 }}
              className="relative w-[1200px]"
            >
              {/* Giant backdrop shape with skewed edges */}
              <div className="absolute inset-0 -skew-x-[12deg] bg-gradient-to-b from-blue-100 via-blue-500 to-blue-900 border-4 border-indigo-300 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
                 <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/40 rounded-full blur-3xl mix-blend-overlay" />
                 <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-400/40 rounded-full blur-3xl mix-blend-overlay" />
              </div>

              {/* Unskewed Content Wrapper */}
              <div className="relative p-10 font-sans">
                
                {/* Header block */}
                <div className="flex flex-col items-center mb-6 drop-shadow-md">
                  <div className="text-white text-5xl font-black uppercase tracking-tighter shadow-black/50">QUARTER FINAL</div>
                  <div className="text-cyan-200 text-sm font-bold tracking-widest uppercase">{matchState.venue || "ADELAIDE OVAL"}</div>
                </div>

                {/* Team Banner */}
                <div className="bg-white px-8 py-3 rounded shadow-inner flex items-center justify-between mb-2">
                  <div className="text-blue-900 font-black text-3xl uppercase tracking-tighter flex gap-2">
                    {matchState.teamA.name} <span className="text-slate-400 font-normal text-xl mt-1">v</span> {matchState.teamB.name}
                  </div>
                  <div className="text-slate-400 font-bold text-xs">STAR SPORTS LIVE</div>
                </div>

                {/* Main Stats Table */}
                <div className="bg-blue-900/80 backdrop-blur-md px-8 py-6 mb-2">
                  <table className="w-full text-left text-white border-collapse">
                    <thead>
                      <tr>
                        <th className="pb-4 border-b border-blue-400/30 text-xs font-bold uppercase tracking-widest">Bowler</th>
                        <th className="pb-4 border-b border-blue-400/30 text-xs font-bold uppercase tracking-widest text-center">Overs</th>
                        <th className="pb-4 border-b border-blue-400/30 text-xs font-bold uppercase tracking-widest text-center">Maidens</th>
                        <th className="pb-4 border-b border-blue-400/30 text-xs font-bold uppercase tracking-widest text-center">Runs</th>
                        <th className="pb-4 border-b border-blue-400/30 text-xs font-bold uppercase tracking-widest text-center">Wickets</th>
                        <th className="pb-4 border-b border-blue-400/30 text-xs font-bold uppercase tracking-widest text-center">Economy</th>
                      </tr>
                    </thead>
                    <tbody className="font-bold text-lg">
                      {bowlingTeam.players.filter(p => p.oversBowled > 0 || p.ballsBowled > 0).map((player) => {
                        const oversFloat = player.oversBowled;
                        let ec = "0.00";
                        if (oversFloat > 0) {
                          const fullOvers = Math.floor(oversFloat);
                          const extraBalls = Math.round((oversFloat % 1) * 10);
                          const totalBalls = fullOvers * 6 + extraBalls;
                          if (totalBalls > 0) ec = ((player.runsConceded / totalBalls) * 6).toFixed(2);
                        }

                        return (
                          <tr key={player.id}>
                            <td className="py-2 text-cyan-50 tracking-wide uppercase">{player.name}</td>
                            <td className="py-2 text-center">{player.oversBowled}</td>
                            <td className="py-2 text-center">0</td>
                            <td className="py-2 text-center">{player.runsConceded}</td>
                            <td className="py-2 text-center text-white text-xl">{player.wicketsTaken}</td>
                            <td className="py-2 text-center">{ec}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer Stats Row */}
                <div className="bg-blue-950/90 text-white flex flex-col px-8 py-3">
                  <div className="flex gap-4 border-b border-blue-800 pb-2 mb-2">
                    <span className="font-bold text-sm tracking-widest w-20">WICKET</span>
                    {matchState.fallOfWickets.map((fow, i) => <span key={i} className="flex-1 font-bold">{fow.wicketNum}</span>)}
                  </div>
                  <div className="flex gap-4 mb-2">
                    <span className="font-bold text-sm tracking-widest w-20">SCORE</span>
                    {matchState.fallOfWickets.map((fow, i) => <span key={i} className="flex-1 font-bold">{fow.runs}</span>)}
                  </div>
                </div>

                {/* Bottom Ribbon */}
                <div className="bg-[#0f172a] text-white flex justify-end items-center gap-12 pr-6">
                  <span className="font-bold text-sm tracking-widest uppercase">EXTRAS <span className="ml-2 font-black text-lg">9</span></span>
                  <span className="font-bold text-sm tracking-widest uppercase">OVERS <span className="ml-2 font-black text-lg">20</span></span>
                  <div className="bg-red-600 px-6 py-2 skew-x-[12deg] -mr-8 -ml-4">
                     <span className="block -skew-x-[12deg] font-black text-4xl tracking-tighter drop-shadow-md">
                        {matchState.runs}-{matchState.wickets}
                     </span>
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}

        {/* =========================================
            LAYOUT 4: MATCH SUMMARY (Reference 4)
        ========================================= */}
        {activePlate === 'match-summary' && (
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col bg-[url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=3567&auto=format&fit=crop')] bg-cover bg-center pt-24"
          >
            <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-sm" />

            {/* Top Gold Trophy & Header */}
            <div className="relative z-10 flex flex-col items-center mb-8">
               <div className="absolute left-1/2 top-10 -translate-x-1/2 w-[2px] h-32 bg-yellow-400" />
               <div className="w-24 h-48 bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-800 rounded-t-full rounded-b-md shadow-[0_0_50px_rgba(234,179,8,0.5)] z-20" />
               
               <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[800px] flex justify-between">
                  <div className="bg-blue-800 text-white font-bold rounded-full px-6 py-1 border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] text-sm tracking-widest">SEMI-FINAL 1</div>
                  <div className="bg-blue-800 text-white font-bold rounded-full px-6 py-1 border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] text-sm tracking-widest uppercase">{matchState.venue || "OLD TRAFFORD"}</div>
               </div>
            </div>
            
            <div className="relative z-10 w-full max-w-[1400px] mx-auto flex gap-12 px-12">
              
              {(() => {
                const getTeamSummary = (teamId: 'team_a' | 'team_b') => {
                  const isCurrentlyBatting = matchState.battingTeamId === teamId;
                  const hasBatted = matchState.currentInnings === 2 && !isCurrentlyBatting;
                  
                  if (isCurrentlyBatting) {
                    return {
                      runs: matchState.runs,
                      wickets: matchState.wickets,
                      oversStr: `${Math.floor(matchState.legalBalls / 6)}.${matchState.legalBalls % 6}`
                    };
                  } else if (hasBatted) {
                    return {
                      runs: matchState.innings1Total?.runs || 0,
                      wickets: matchState.innings1Total?.wickets || 0,
                      oversStr: `${matchState.maxOvers}.0`
                    };
                  } else {
                    return { runs: 0, wickets: 0, oversStr: "0.0" };
                  }
                };

                const teamASummary = getTeamSummary('team_a');
                const teamBSummary = getTeamSummary('team_b');

                return (
                  <>
                    {/* TEAM A PANEL */}
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="bg-blue-900 border-2 border-yellow-500 rounded text-center py-2 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                        <h2 className="text-3xl font-bold text-yellow-500 uppercase tracking-widest drop-shadow-md">{matchState.teamA.name}</h2>
                      </div>
                      <div className="bg-blue-700 flex text-white shadow-lg border-2 border-blue-900">
                         <div className="w-16 bg-black flex items-center justify-center border-r-2 border-blue-900">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white to-gray-400 shadow-inner" />
                         </div>
                         <div className="flex-1 text-center py-2 text-5xl font-black tracking-tighter drop-shadow-md">
                            {teamASummary.runs}-{teamASummary.wickets}
                         </div>
                      </div>

                      <div className="flex flex-col gap-[2px] mt-2">
                        {matchState.teamA.players.slice().sort((a,b) => b.runsScored - a.runsScored).slice(0,3).map(p => (
                          <div key={p.id} className="flex bg-blue-900 h-10 border border-blue-950">
                            <div className="flex-1 bg-white flex items-center px-4 font-bold text-blue-900 uppercase tracking-wide">{p.name}</div>
                            <div className="w-16 bg-white border-l border-blue-900 flex items-center justify-center font-bold text-blue-900 text-xl">{p.runsScored}</div>
                            <div className="w-12 bg-white border-l border-slate-300 flex items-center justify-center font-bold text-slate-500 text-sm">{p.ballsFaced}</div>
                          </div>
                        ))}
                      </div>

                      <div className="bg-blue-900 flex text-white shadow-lg border-2 border-blue-950 mt-4 rounded-full w-max mx-auto px-6 py-1 pr-10">
                         <div className="w-6 h-6 rounded-full bg-gradient-to-br from-white to-gray-400 shadow-inner mr-4 mt-1" />
                         <div className="text-center text-xl font-bold tracking-widest drop-shadow-md uppercase">OVERS {teamASummary.oversStr}</div>
                      </div>

                      <div className="flex flex-col gap-[2px] mt-4">
                        {matchState.teamA.players.slice().sort((a,b) => b.wicketsTaken - a.wicketsTaken).slice(0,3).map(p => (
                          <div key={p.id} className="flex bg-blue-900 h-10 border border-blue-950">
                            <div className="flex-1 bg-white flex items-center px-4 font-bold text-blue-900 uppercase tracking-wide">{p.name}</div>
                            <div className="w-20 bg-white border-l border-blue-900 flex items-center justify-center font-bold text-blue-900 text-xl">{p.wicketsTaken}-{p.runsConceded}</div>
                            <div className="w-12 bg-white border-l border-slate-300 flex items-center justify-center font-bold text-slate-500 text-sm">{p.oversBowled}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* TEAM B PANEL */}
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="bg-blue-900 border-2 border-yellow-500 rounded text-center py-2 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                        <h2 className="text-3xl font-bold text-yellow-500 uppercase tracking-widest drop-shadow-md">{matchState.teamB.name}</h2>
                      </div>
                      <div className="bg-blue-700 flex text-white shadow-lg border-2 border-blue-900">
                         <div className="w-16 bg-black flex items-center justify-center border-r-2 border-blue-900">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white to-gray-400 shadow-inner" />
                         </div>
                         <div className="flex-1 text-center py-2 text-5xl font-black tracking-tighter drop-shadow-md">
                            {teamBSummary.runs}-{teamBSummary.wickets}
                         </div>
                      </div>

                      <div className="flex flex-col gap-[2px] mt-2">
                        {matchState.teamB.players.slice().sort((a,b) => b.runsScored - a.runsScored).slice(0,3).map(p => (
                          <div key={p.id} className="flex bg-blue-900 h-10 border border-blue-950">
                            <div className="flex-1 bg-white flex items-center px-4 font-bold text-blue-900 uppercase tracking-wide">{p.name}</div>
                            <div className="w-16 bg-white border-l border-blue-900 flex items-center justify-center font-bold text-blue-900 text-xl">{p.runsScored}</div>
                            <div className="w-12 bg-white border-l border-slate-300 flex items-center justify-center font-bold text-slate-500 text-sm">{p.ballsFaced}</div>
                          </div>
                        ))}
                      </div>

                      <div className="bg-blue-900 flex text-white shadow-lg border-2 border-blue-950 mt-4 rounded-full w-max mx-auto px-6 py-1 pr-10">
                         <div className="w-6 h-6 rounded-full bg-gradient-to-br from-white to-gray-400 shadow-inner mr-4 mt-1" />
                         <div className="text-center text-xl font-bold tracking-widest drop-shadow-md uppercase">OVERS {teamBSummary.oversStr}</div>
                      </div>

                      <div className="flex flex-col gap-[2px] mt-4">
                  {matchState.teamB.players.slice().sort((a,b) => b.wicketsTaken - a.wicketsTaken).slice(0,3).map(p => (
                    <div key={p.id} className="flex bg-blue-900 h-10 border border-blue-950">
                      <div className="flex-1 bg-white flex items-center px-4 font-bold text-blue-900 uppercase tracking-wide">{p.name}</div>
                      <div className="w-20 bg-white border-l border-blue-900 flex items-center justify-center font-bold text-blue-900 text-xl">{p.wicketsTaken}-{p.runsConceded}</div>
                      <div className="w-12 bg-white border-l border-slate-300 flex items-center justify-center font-bold text-slate-500 text-sm">{p.oversBowled}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          );
        })()}
      </div>

            {/* Bottom Match Result Ribbon */}
            <div className="relative z-10 w-full max-w-[1200px] mx-auto mt-12 bg-yellow-400 border-2 border-yellow-600 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
               <div className="text-center text-red-900 text-3xl font-bold uppercase tracking-widest py-3">
                 {matchState.matchStatus === 'completed' 
                   ? "MATCH CONCLUDED" 
                   : (matchState.target ? `TARGET: ${matchState.target}` : "1ST INNINGS IN PROGRESS")}
               </div>
            </div>
          </motion.div>
        )}

      </div>
    </AnimatePresence>
  );
}
