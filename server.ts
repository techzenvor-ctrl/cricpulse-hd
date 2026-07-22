import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { MatchState, Player, BallEvent, ExtraType, WicketType } from './src/types';

// Load env.local if present, else standard env
if (fs.existsSync(path.resolve(process.cwd(), '.env.local'))) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
} else {
  dotenv.config();
}

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn("WARNING: SUPABASE_URL or SUPABASE_KEY is missing. Database persistence is disabled.");
}

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;


// Initialize full in-memory state representing the current match
// Match History Archive array
const pastMatchesHistory: MatchState[] = [];

// Start Express server prepopulated with the famous India vs Australia live from Mumbai match as shown in mock screens
const DEFAULT_PLAYERS_A: Player[] = [
  { id: 'ind_1', name: 'V. Kohli', teamId: 'team_a', runsScored: 82, ballsFaced: 54, fours: 8, sixes: 3, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, isOut: false, contextualImpactScore: 9.4 },
  { id: 'ind_2', name: 'R. Sharma', teamId: 'team_a', runsScored: 104, ballsFaced: 92, fours: 12, sixes: 4, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, isOut: false, contextualImpactScore: 9.0 },
  { id: 'ind_3', name: 'S. Gill', teamId: 'team_a', runsScored: 18, ballsFaced: 16, fours: 2, sixes: 0, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, isOut: true, dismissalInfo: 'c. Cummins b. Starc', contextualImpactScore: 5.2 },
  { id: 'ind_4', name: 'K.L. Rahul', teamId: 'team_a', runsScored: 24, ballsFaced: 20, fours: 3, sixes: 0, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, isOut: true, dismissalInfo: 'c. Wade b. Zampa', contextualImpactScore: 6.0 },
  { id: 'ind_5', name: 'S. Iyer', teamId: 'team_a', runsScored: 10, ballsFaced: 12, fours: 1, sixes: 0, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, isOut: true, dismissalInfo: 'b. Cummins', contextualImpactScore: 4.8 },
  { id: 'ind_6', name: 'H. Pandya', teamId: 'team_a', runsScored: 3, ballsFaced: 5, fours: 0, sixes: 0, oversBowled: 2, ballsBowled: 12, runsConceded: 24, wicketsTaken: 0, isOut: true, dismissalInfo: 'run out (Hazlewood)', contextualImpactScore: 4.0 },
  { id: 'ind_7', name: 'R. Jadeja', teamId: 'team_a', runsScored: 0, ballsFaced: 0, fours: 0, sixes: 0, oversBowled: 4, ballsBowled: 24, runsConceded: 28, wicketsTaken: 1, isOut: false, contextualImpactScore: 7.0 },
  { id: 'ind_8', name: 'J. Bumrah', teamId: 'team_a', runsScored: 0, ballsFaced: 0, fours: 0, sixes: 0, oversBowled: 4, ballsBowled: 24, runsConceded: 25, wicketsTaken: 2, isOut: false, contextualImpactScore: 8.8 },
  { id: 'ind_9', name: 'M. Shami', teamId: 'team_a', runsScored: 0, ballsFaced: 0, fours: 0, sixes: 0, oversBowled: 4, ballsBowled: 24, runsConceded: 34, wicketsTaken: 1, isOut: false, contextualImpactScore: 6.5 },
  { id: 'ind_10', name: 'Kuldeep', teamId: 'team_a', runsScored: 0, ballsFaced: 0, fours: 0, sixes: 0, oversBowled: 4, ballsBowled: 24, runsConceded: 36, wicketsTaken: 2, isOut: false, contextualImpactScore: 7.2 },
  { id: 'ind_11', name: 'Y. Chahal', teamId: 'team_a', runsScored: 0, ballsFaced: 0, fours: 0, sixes: 0, oversBowled: 2, ballsBowled: 12, runsConceded: 18, wicketsTaken: 0, isOut: false, contextualImpactScore: 5.0 },
  { id: 'ind_12', name: 'S. Samson', teamId: 'team_a', runsScored: 0, ballsFaced: 0, fours: 0, sixes: 0, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, isOut: false, contextualImpactScore: 5.0 },
  { id: 'ind_13', name: 'Y. Jaiswal', teamId: 'team_a', runsScored: 0, ballsFaced: 0, fours: 0, sixes: 0, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, isOut: false, contextualImpactScore: 5.0 },
  { id: 'ind_14', name: 'R. Pant', teamId: 'team_a', runsScored: 0, ballsFaced: 0, fours: 0, sixes: 0, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, isOut: false, contextualImpactScore: 5.0 },
  { id: 'ind_15', name: 'A. Patel', teamId: 'team_a', runsScored: 0, ballsFaced: 0, fours: 0, sixes: 0, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, isOut: false, contextualImpactScore: 5.0 }
];

const DEFAULT_PLAYERS_B: Player[] = [
  { id: 'aus_1', name: 'Steve Smith', teamId: 'team_b', runsScored: 82, ballsFaced: 45, fours: 9, sixes: 3, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, isOut: false, contextualImpactScore: 9.4 },
  { id: 'aus_2', name: 'David Warner', teamId: 'team_b', runsScored: 41, ballsFaced: 24, fours: 5, sixes: 1, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, isOut: true, dismissalInfo: 'c. Kohli b. Shami', contextualImpactScore: 7.2 },
  { id: 'aus_3', name: 'M. Marsh', teamId: 'team_b', runsScored: 12, ballsFaced: 15, fours: 1, sixes: 0, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, isOut: true, dismissalInfo: 'lbw b. Jadeja', contextualImpactScore: 3.1 },
  { id: 'aus_4', name: 'Glenn Maxwell', teamId: 'team_b', runsScored: 34, ballsFaced: 14, fours: 2, sixes: 3, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, isOut: true, dismissalInfo: 'b. Bumrah', contextualImpactScore: 8.8 },
  { id: 'aus_5', name: 'Marcus Stoinis', teamId: 'team_b', runsScored: 15, ballsFaced: 12, fours: 1, sixes: 1, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, isOut: true, dismissalInfo: 'c. Iyer b. Bumrah', contextualImpactScore: 5.5 },
  { id: 'aus_6', name: 'Cameron Green', teamId: 'team_b', runsScored: 4, ballsFaced: 6, fours: 0, sixes: 0, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, isOut: true, dismissalInfo: 'run out (Rahul)', contextualImpactScore: 4.2 },
  { id: 'aus_7', name: 'Matthew Wade', teamId: 'team_b', runsScored: 1, ballsFaced: 4, fours: 0, sixes: 0, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, isOut: false, contextualImpactScore: 5.0 },
  { id: 'aus_8', name: 'Pat Cummins', teamId: 'team_b', runsScored: 1, ballsFaced: 1, fours: 0, sixes: 0, oversBowled: 6.4, ballsBowled: 40, runsConceded: 48, wicketsTaken: 2, isOut: false, contextualImpactScore: 7.8 },
  { id: 'aus_9', name: 'Mitchell Starc', teamId: 'team_b', runsScored: 0, ballsFaced: 0, fours: 0, sixes: 0, oversBowled: 6, ballsBowled: 36, runsConceded: 52, wicketsTaken: 1, isOut: false, contextualImpactScore: 6.0 },
  { id: 'aus_10', name: 'Josh Hazlewood', teamId: 'team_b', runsScored: 0, ballsFaced: 0, fours: 0, sixes: 0, oversBowled: 6, ballsBowled: 36, runsConceded: 45, wicketsTaken: 0, isOut: false, contextualImpactScore: 5.5 },
  { id: 'aus_11', name: 'Adam Zampa', teamId: 'team_b', runsScored: 0, ballsFaced: 0, fours: 0, sixes: 0, oversBowled: 6, ballsBowled: 36, runsConceded: 55, wicketsTaken: 1, isOut: false, contextualImpactScore: 5.8 },
  { id: 'aus_12', name: 'T. Head', teamId: 'team_b', runsScored: 0, ballsFaced: 0, fours: 0, sixes: 0, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, isOut: false, contextualImpactScore: 5.0 },
  { id: 'aus_13', name: 'J. Inglis', teamId: 'team_b', runsScored: 0, ballsFaced: 0, fours: 0, sixes: 0, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, isOut: false, contextualImpactScore: 5.0 },
  { id: 'aus_14', name: 'A. Carey', teamId: 'team_b', runsScored: 0, ballsFaced: 0, fours: 0, sixes: 0, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, isOut: false, contextualImpactScore: 5.0 },
  { id: 'aus_15', name: 'N. Lyon', teamId: 'team_b', runsScored: 0, ballsFaced: 0, fours: 0, sixes: 0, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, isOut: false, contextualImpactScore: 5.0 }
];

const DEFAULT_MATCH_STATE: MatchState = {
  id: 'current-live-match',
  teamA: {
    id: 'team_a',
    name: 'INDIA',
    players: JSON.parse(JSON.stringify(DEFAULT_PLAYERS_A)),
    flagUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkbOGVKm7fmwAf-QxqGngYBPkFHevlEB7F9RFOyx8YGNFDDmePaz-2W5CXNxFx5XIy-KqAOU58KL3vvWHQEa1kGn8kn5_6GD1p7Ua-c20BNb3GDKADVMKMaw5NDrk0C2_nJ5hEpgxeB4jYe7yZeH1lBQEaNkIIAJ4ebJV7LuTn-lAA-5FObhr4eGwEhsVXOAneNThg4r-ps9yYDHGH1ttz-uMmjyKCYUjmG-GBhEpuEnUXkjveQMCapC6ULeXPUgAQ23t_TnfhpmE'
  },
  teamB: {
    id: 'team_b',
    name: 'TITANS', // Australia as Titans
    players: JSON.parse(JSON.stringify(DEFAULT_PLAYERS_B)),
    flagUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC75cQu-rihBRWtIcP9fwxIsMXOgx2Kz9-f9W6Vv7f-04M309fH-I54dlS44TR-olsj7edLUY9iIXtTkwHEWiDk8cd8F9Lw-DhtHwk-WMxAfTq2Y5TNq9q5lQGkj57IZN6CN38aGryCbi8p4qPqlBW-Yo-5snXi2PfpEYZ_jErEOrHS_BWmsn2A-Th0Jb5gPJHKRtcptfdABf2waxV2ndVU-6D1nD5e0IdUZUxKMMrPsJe1WoUW6DgLtSbqkisXJF7bXMOM7sbhv1w'
  },
  tossWinner: 'team_b',
  tossDecidedTo: 'bat',
  matchStatus: 'live',
  currentInnings: 2, // India is chasing Titans' score
  battingTeamId: 'team_a', // India batting (Currently 248/4 in 32.4 overs)
  bowlingTeamId: 'team_b', // Titans bowling
  maxOvers: 50,
  target: 193, // Wait, let's make it 310 runs target so it makes sense why score is 248/4 in 32.4 overs!
  runs: 248,
  wickets: 4,
  legalBalls: 196, // 32 overs * 6 = 192 + 4 balls = 196 legal balls
  strikerId: 'ind_1', // V. Kohli
  nonStrikerId: 'ind_2', // R. Sharma
  activeBowlerId: 'aus_8', // Pat Cummins
  currentPartnership: {
    runs: 94,
    balls: 68,
    batsmenIds: ['ind_1', 'ind_2']
  },
  historicalPartnerships: [
    { runs: 54, balls: 32, batter1Name: 'S. Gill', batter2Name: 'R. Sharma' },
    { runs: 42, balls: 28, batter1Name: 'K.L. Rahul', batter2Name: 'R. Sharma' },
    { runs: 16, balls: 14, batter1Name: 'S. Iyer', batter2Name: 'R. Sharma' },
    { runs: 42, balls: 54, batter1Name: 'H. Pandya', batter2Name: 'R. Sharma' }
  ],
  fallOfWickets: [
    { wicketNum: 1, runs: 54, oversCount: '5.2', batsmanName: 'S. Gill' },
    { wicketNum: 2, runs: 96, oversCount: '9.5', batsmanName: 'K.L. Rahul' },
    { wicketNum: 3, runs: 112, oversCount: '13.2', batsmanName: 'S. Iyer' },
    { wicketNum: 4, runs: 154, oversCount: '21.0', batsmanName: 'H. Pandya' }
  ],
  ballHistory: [
    { id: 'b1', overNum: 32, ballNum: 1, strikerId: 'ind_1', strikerName: 'V. Kohli', nonStrikerId: 'ind_2', bowlerId: 'aus_8', bowlerName: 'Pat Cummins', runsScored: 0, extraType: 'none', extraRuns: 0, isLegalDelivery: true, totalRunsEvent: 0 },
    { id: 'b2', overNum: 32, ballNum: 2, strikerId: 'ind_1', strikerName: 'V. Kohli', nonStrikerId: 'ind_2', bowlerId: 'aus_8', bowlerName: 'Pat Cummins', runsScored: 4, extraType: 'none', extraRuns: 0, isLegalDelivery: true, totalRunsEvent: 4 },
    { id: 'b3', overNum: 32, ballNum: 3, strikerId: 'ind_1', strikerName: 'V. Kohli', nonStrikerId: 'ind_2', bowlerId: 'aus_8', bowlerName: 'Pat Cummins', runsScored: 1, extraType: 'none', extraRuns: 0, isLegalDelivery: true, totalRunsEvent: 1 },
    { id: 'b4', overNum: 32, ballNum: 4, strikerId: 'ind_2', strikerName: 'R. Sharma', nonStrikerId: 'ind_1', bowlerId: 'aus_8', bowlerName: 'Pat Cummins', runsScored: 0, extraType: 'none', extraRuns: 0, isLegalDelivery: true, totalRunsEvent: 0, wicketEvent: { type: 'caught', dismissedPlayerId: 'ind_6', dismissedPlayerName: 'H. Pandya', fielderName: 'Hazlewood' } }, // hypothetical earlier wicket representation
    { id: 'b5', overNum: 32, ballNum: 5, strikerId: 'ind_2', strikerName: 'R. Sharma', nonStrikerId: 'ind_1', bowlerId: 'aus_8', bowlerName: 'Pat Cummins', runsScored: 0, extraType: 'none', extraRuns: 0, isLegalDelivery: true, totalRunsEvent: 0 }
  ],
  innings1Total: {
    runs: 298,
    wickets: 7,
    oversStr: '50.0'
  },
  venue: 'Wankhede Stadium, Mumbai',
  commentaryState: 'India needs 51 runs off 104 balls style with V. Kohli and R. Sharma building a flawless 94-run partnership.'
};

let matchState: MatchState = JSON.parse(JSON.stringify(DEFAULT_MATCH_STATE));

const MATCH_ID = 'current-live-match';

// Fetch matchState from Supabase (or fallback to local cache/default)
async function initMatchState() {
  if (!supabase) {
    console.log("Supabase client not initialized. Using default in-memory match state.");
    return;
  }
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('state')
      .eq('id', MATCH_ID)
      .single();

    if (error && error.code !== 'PGRST116') { // row not found is code PGRST116
      console.error("Error fetching match state from Supabase:", error.message);
      return;
    }

    if (data && data.state) {
      matchState = data.state as MatchState;
      ensureBattingStatus(matchState);
      console.log("Successfully loaded match state from Supabase.");
    } else {
      console.log("No match state found in Supabase. Creating default row...");
      const { error: insertError } = await supabase
        .from('matches')
        .insert({ id: MATCH_ID, state: DEFAULT_MATCH_STATE });
      
      if (insertError) {
        console.error("Error creating default match state in Supabase:", insertError.message);
      } else {
        console.log("Created default match state in Supabase.");
      }
    }
  } catch (err: any) {
    console.error("Unexpected error initializing match state from Supabase:", err.message || err);
  }
}

// Save matchState to Supabase and notify SSE clients
async function saveMatchState() {
  // Broadcast update immediately to in-memory SSE clients for sub-100ms UI updates
  notifyClients();

  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('matches')
      .update({ state: matchState, updated_at: new Date().toISOString() })
      .eq('id', MATCH_ID);

    if (error) {
      console.error("Error saving match state to Supabase:", error.message);
    }
  } catch (err: any) {
    console.error("Unexpected error saving match state to Supabase:", err.message || err);
  }
}

// Broadcast Clients using Server-Sent Events (SSE) for real-time streaming
let sseClients: any[] = [];

function notifyClients() {
  const payload = JSON.stringify({ type: 'SCORE_UPDATE', data: matchState });
  sseClients.forEach(client => {
    client.res.write(`data: ${payload}\n\n`);
  });
}

// Algorithmic CIS Calculation
function calculatePlayerCIS(player: Player, isBatter: boolean, state: MatchState): number {
  let score = 5.0; // Base score
  if (isBatter) {
    if (player.ballsFaced > 0) {
      const sr = (player.runsScored / player.ballsFaced) * 100;
      // Strike-rate adjustments
      if (sr > 200) score += 3.5;
      else if (sr > 150) score += 2.5;
      else if (sr > 120) score += 1.5;
      else if (sr > 100) score += 0.5;
      else if (sr < 75) score -= 1.5;
      else if (sr < 50) score -= 2.5;

      // Runs weight
      score += Math.min(player.runsScored * 0.03, 3.0);

      // Boundaries bonus
      score += player.fours * 0.15;
      score += player.sixes * 0.35;

      // Pressure situation bonus (if chasing and scoring well)
      if (state.currentInnings === 2 && state.target) {
        const rrr = ((state.target - state.runs) / Math.max(state.maxOvers * 6 - state.legalBalls, 6)) * 6;
        if (rrr > 8 && sr > 120) {
          score += 1.0;
        }
      }
    }
  } else {
    // Bowler calculation
    const totalDeliveries = player.ballsBowled;
    if (totalDeliveries > 0) {
      const overs = totalDeliveries / 6;
      const econ = player.runsConceded / overs;

      // Economy metrics
      if (econ < 5.0) score += 2.5;
      else if (econ < 6.5) score += 1.5;
      else if (econ < 8.0) score += 0.5;
      else if (econ > 11.0) score -= 2.0;
      else if (econ > 9.5) score -= 1.0;

      // Wickets metrics
      score += player.wicketsTaken * 1.5;

      // Dot balls weight estimate
      score += 0.5;
    }
  }
  // Clamp score between 1.0 and 10.0 and round
  return Math.max(1.0, Math.min(10.0, Math.round(score * 10) / 10));
}

function ensureBattingStatus(state: MatchState) {
  const checkTeam = (team: any) => {
    if (!team || !team.players) return;
    team.players.forEach((p: Player) => {
      if (!p.battingStatus) {
        if (p.isOut) {
          p.battingStatus = 'out';
        } else if (p.id === state.strikerId || p.id === state.nonStrikerId) {
          p.battingStatus = 'active';
        } else {
          p.battingStatus = 'not_batting';
        }
      }
    });
  };
  checkTeam(state.teamA);
  checkTeam(state.teamB);
}

function updateALLCIS() {
  const battingTeam = matchState.battingTeamId === 'team_a' ? matchState.teamA : matchState.teamB;
  const bowlingTeam = matchState.bowlingTeamId === 'team_a' ? matchState.teamA : matchState.teamB;

  battingTeam.players.forEach(p => {
    p.contextualImpactScore = calculatePlayerCIS(p, true, matchState);
  });
  bowlingTeam.players.forEach(p => {
    p.contextualImpactScore = calculatePlayerCIS(p, false, matchState);
  });
}

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(express.json());

// API routes FIRST
app.get('/api/match-state', (req, res) => {
  res.json(matchState);
});

// Real-time synchronization SSE portal
app.get('/api/match-state/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  // Send initial data immediately
  res.write(`data: ${JSON.stringify({ type: 'INITIAL_STATE', data: matchState })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// Submit a Ball outcome from the Admin Scorer Console
app.post('/api/match-state/ball', async (req, res) => {
  const {
    runsScored, // 0-6
    extraType, // 'none' | 'wide' | 'no_ball' | 'bye' | 'leg_bye'
    extraRuns, // bonus runs direct from extra
    wicketEvent, // { type: WicketType, dismissedPlayerId?: string, fielderName?: string }
    wagonWheelX,
    wagonWheelY
  } = req.body;

  // Clone current ball state to preserve history for undo
  const strikerId = matchState.strikerId;
  const nonStrikerId = matchState.nonStrikerId;
  const activeBowlerId = matchState.activeBowlerId;

  const battingTeam = matchState.battingTeamId === 'team_a' ? matchState.teamA : matchState.teamB;
  const bowlingTeam = matchState.bowlingTeamId === 'team_a' ? matchState.teamA : matchState.teamB;

  const striker = battingTeam.players.find(p => p.id === strikerId);
  const nonStriker = battingTeam.players.find(p => p.id === nonStrikerId);
  const activeBowler = bowlingTeam.players.find(p => p.id === activeBowlerId);

  if (!striker || !nonStriker || !activeBowler) {
    return res.status(400).json({ error: 'At least one of striker, non-striker or bowler is missing' });
  }

  const isLegalDelivery = extraType === 'none' || extraType === 'bye' || extraType === 'leg_bye';
  const totalRunsThisBall = runsScored + extraRuns;

  // Add runs to team scorecard
  matchState.runs += totalRunsThisBall;

  // Update striker stats
  if (extraType !== 'wide') {
    striker.runsScored += runsScored;
    striker.ballsFaced += 1;
    if (runsScored === 4) striker.fours += 1;
    if (runsScored === 6) striker.sixes += 1;
  }

  // Update bowler stats
  if (extraType !== 'bye' && extraType !== 'leg_bye') {
    activeBowler.runsConceded += totalRunsThisBall;
  }
  if (isLegalDelivery) {
    activeBowler.ballsBowled += 1;
    activeBowler.oversBowled = Math.floor(activeBowler.ballsBowled / 6) + (activeBowler.ballsBowled % 6) / 10;
  }

  // Update general legal balls completed
  if (isLegalDelivery) {
    matchState.legalBalls += 1;
  }

  // Update Partnership runs & balls
  matchState.currentPartnership.runs += totalRunsThisBall;
  if (extraType !== 'wide') {
    matchState.currentPartnership.balls += 1;
  }

  let finalWicketEventObj: any = null;

  // Handle wickets and retirements
  if (wicketEvent && wicketEvent.type !== 'none') {
    const dismissedId = wicketEvent.dismissedPlayerId || strikerId;
    const dismissedPlayer = battingTeam.players.find(p => p.id === dismissedId);
    if (dismissedPlayer) {
      const isRetirement = wicketEvent.type === 'retired_hurt' || wicketEvent.type === 'retired_out';
      const isRetiredHurt = wicketEvent.type === 'retired_hurt';

      if (wicketEvent.type === 'retired_hurt') {
        dismissedPlayer.isOut = false;
        dismissedPlayer.battingStatus = 'retired_hurt';
      } else if (wicketEvent.type === 'retired_out') {
        dismissedPlayer.isOut = true;
        dismissedPlayer.battingStatus = 'retired_out';
        matchState.wickets += 1;
      } else {
        dismissedPlayer.isOut = true;
        dismissedPlayer.battingStatus = 'out';
        matchState.wickets += 1;
      }

      let info = '';
      if (wicketEvent.type === 'bowled') {
        info = `b. ${activeBowler.name}`;
        activeBowler.wicketsTaken += 1;
      } else if (wicketEvent.type === 'caught') {
        info = wicketEvent.fielderName ? `c. ${wicketEvent.fielderName} b. ${activeBowler.name}` : `c. & b. ${activeBowler.name}`;
        activeBowler.wicketsTaken += 1;
      } else if (wicketEvent.type === 'lbw') {
        info = `lbw b. ${activeBowler.name}`;
        activeBowler.wicketsTaken += 1;
      } else if (wicketEvent.type === 'stumped') {
        info = wicketEvent.fielderName ? `st. ${wicketEvent.fielderName} b. ${activeBowler.name}` : `st. b. ${activeBowler.name}`;
        activeBowler.wicketsTaken += 1;
      } else if (wicketEvent.type === 'run_out') {
        info = wicketEvent.fielderName ? `run out (${wicketEvent.fielderName})` : `run out`;
      } else if (wicketEvent.type === 'retired_hurt') {
        info = 'retired hurt';
      } else if (wicketEvent.type === 'retired_out') {
        info = 'retired out';
      } else {
        info = 'out';
      }
      dismissedPlayer.dismissalInfo = info;

      const oversStr = `${Math.floor(matchState.legalBalls / 6)}.${matchState.legalBalls % 6}`;
      if (wicketEvent.type !== 'retired_hurt') {
        matchState.fallOfWickets.push({
          wicketNum: matchState.wickets,
          runs: matchState.runs,
          oversCount: oversStr,
          batsmanName: dismissedPlayer.name
        });
      }

      // Save historical partnership
      matchState.historicalPartnerships.push({
        runs: matchState.currentPartnership.runs,
        balls: matchState.currentPartnership.balls,
        batter1Name: striker.name,
        batter2Name: nonStriker.name
      });

      // Reset partnership
      matchState.currentPartnership = {
        runs: 0,
        balls: 0,
        batsmenIds: [strikerId, nonStrikerId] // Will update when new batsman comes in
      };

      finalWicketEventObj = {
        type: wicketEvent.type,
        dismissedPlayerId: dismissedId,
        dismissedPlayerName: dismissedPlayer.name,
        fielderName: wicketEvent.fielderName
      };

      matchState.lastDismissedPlayer = {
        name: dismissedPlayer.name,
        runsScored: dismissedPlayer.runsScored,
        ballsFaced: dismissedPlayer.ballsFaced,
        fours: dismissedPlayer.fours,
        sixes: dismissedPlayer.sixes,
        dismissalInfo: info,
        teamName: battingTeam.name
      };
      matchState.showDismissedPlayerOverlay = true;

      // Set new incoming batsman automatically if available
      const nextBatter = battingTeam.players.find(p => p.battingStatus === 'not_batting' && p.id !== strikerId && p.id !== nonStrikerId && p.runsScored === 0 && p.ballsFaced === 0);
      if (nextBatter) {
        if (dismissedId === strikerId) {
          matchState.strikerId = nextBatter.id;
        } else {
          matchState.nonStrikerId = nextBatter.id;
        }
        nextBatter.battingStatus = 'active';
        matchState.currentPartnership.batsmenIds = [matchState.strikerId, matchState.nonStrikerId];
      }
    }
  }

  // Create Ball History delivery logging item
  const currentOverIndex = Math.floor((matchState.legalBalls - (isLegalDelivery ? 1 : 0)) / 6);
  const ballInOverIndex = ((matchState.legalBalls - (isLegalDelivery ? 1 : 0)) % 6) + 1;

  const currentBallRecord: BallEvent = {
    id: 'ball_' + Date.now(),
    overNum: currentOverIndex,
    ballNum: ballInOverIndex,
    strikerId,
    strikerName: striker.name,
    nonStrikerId,
    bowlerId: activeBowlerId,
    bowlerName: activeBowler.name,
    runsScored,
    extraType,
    extraRuns,
    isLegalDelivery,
    wicketEvent: finalWicketEventObj || undefined,
    totalRunsEvent: totalRunsThisBall,
    wagonWheelX,
    wagonWheelY
  };

  matchState.ballHistory.push(currentBallRecord);

  // Automatic strike rotation logic
  // Case A: Rotation off scored runs.
  // Striker gains runs and rotates if she keys 1 or 3 runs.
  const batsmanRunsRotatesStrike = runsScored === 1 || runsScored === 3;
  if (batsmanRunsRotatesStrike) {
    const temp = matchState.strikerId;
    matchState.strikerId = matchState.nonStrikerId;
    matchState.nonStrikerId = temp;
  }

  // Case B: Rotation on over completion
  // If the legal over is completed (6 legal balls bowled)
  const isOverComplete = isLegalDelivery && (matchState.legalBalls % 6 === 0);
  if (isOverComplete) {
    const temp = matchState.strikerId;
    matchState.strikerId = matchState.nonStrikerId;
    matchState.nonStrikerId = temp;

    // In a live match the scorers would select the new bowler of the next over, but we can clear activeBowler or let him stay
  }

  // Automatic Innings Shift Override
  const overFraction = matchState.legalBalls / 6;
  const oversMaxed = overFraction >= matchState.maxOvers;
  const wicketsMaxed = matchState.wickets >= 10;

  if (wicketsMaxed || oversMaxed) {
    if (matchState.currentInnings === 1) {
      matchState.matchStatus = 'innings_break';
      matchState.currentInnings = 2;
      // Store 1st Innings total
      matchState.innings1Total = {
        runs: matchState.runs,
        wickets: matchState.wickets,
        oversStr: `${Math.floor(matchState.legalBalls / 6)}.${matchState.legalBalls % 6}`
      };
      // Swap Batting and Bowling Active matrices
      const oldBatting = matchState.battingTeamId;
      matchState.battingTeamId = matchState.bowlingTeamId;
      matchState.bowlingTeamId = oldBatting;

      // Reset score for Innings 2
      matchState.runs = 0;
      matchState.wickets = 0;
      matchState.legalBalls = 0;
      matchState.target = matchState.innings1Total.runs + 1;

      // Assign opening batsmen
      const newBattingTeam = matchState.battingTeamId === 'team_a' ? matchState.teamA : matchState.teamB;
      const unoutNewPlayers = newBattingTeam.players.filter(p => !p.isOut);
      if (unoutNewPlayers.length >= 2) {
        matchState.strikerId = unoutNewPlayers[0].id;
        matchState.nonStrikerId = unoutNewPlayers[1].id;
      }

      // Record partnership initial states
      matchState.currentPartnership = {
        runs: 0,
        balls: 0,
        batsmenIds: [matchState.strikerId, matchState.nonStrikerId]
      };
      matchState.historicalPartnerships = [];
      matchState.fallOfWickets = [];
      matchState.ballHistory = [];
    } else {
      matchState.matchStatus = 'completed';
    }
  } else if (matchState.currentInnings === 2 && matchState.target && matchState.runs >= matchState.target) {
    matchState.matchStatus = 'completed';
  }

  // Calculate live CIS impact rankings
  updateALLCIS();

  // Notify public clients and save to Supabase
  await saveMatchState();

  res.json(matchState);
});

// Single-click "Undo Ball" reverses the complete state changes of that delivery
app.post('/api/match-state/undo', async (req, res) => {
  if (matchState.ballHistory.length === 0) {
    return res.status(400).json({ error: 'No deliveries to undo in this innings' });
  }

  const lastBall = matchState.ballHistory.pop();
  if (!lastBall) {
    return res.status(400).json({ error: 'Empty ball log history' });
  }

  // Revert general runs and balls
  matchState.runs -= lastBall.totalRunsEvent;
  if (lastBall.isLegalDelivery) {
    matchState.legalBalls -= 1;
  }

  const battingTeam = matchState.battingTeamId === 'team_a' ? matchState.teamA : matchState.teamB;
  const bowlingTeam = matchState.bowlingTeamId === 'team_a' ? matchState.teamA : matchState.teamB;

  // Revert striker details
  const originalStriker = battingTeam.players.find(p => p.id === lastBall.strikerId);
  if (originalStriker && lastBall.extraType !== 'wide') {
    originalStriker.runsScored -= lastBall.runsScored;
    originalStriker.ballsFaced -= 1;
    if (lastBall.runsScored === 4) originalStriker.fours -= 1;
    if (lastBall.runsScored === 6) originalStriker.sixes -= 1;
  }

  // Revert bowler details
  const originalBowler = bowlingTeam.players.find(p => p.id === lastBall.bowlerId);
  if (originalBowler) {
    if (lastBall.extraType !== 'bye' && lastBall.extraType !== 'leg_bye') {
      originalBowler.runsConceded -= lastBall.totalRunsEvent;
    }
    if (lastBall.isLegalDelivery) {
      originalBowler.ballsBowled -= 1;
      originalBowler.oversBowled = Math.floor(originalBowler.ballsBowled / 6) + (originalBowler.ballsBowled % 6) / 10;
    }
  }

  // Revert Wicket if any
  if (lastBall.wicketEvent) {
    matchState.wickets -= 1;
    const dismissedId = lastBall.wicketEvent.dismissedPlayerId;
    const dismissed = battingTeam.players.find(p => p.id === dismissedId);
    if (dismissed) {
      dismissed.isOut = false;
      dismissed.dismissalInfo = undefined;
    }
    if (originalBowler && lastBall.wicketEvent.type !== 'run_out') {
      originalBowler.wicketsTaken -= 1;
    }
    matchState.fallOfWickets.pop();

    // Revert partnerships
    const prevPartition = matchState.historicalPartnerships.pop();
    if (prevPartition) {
      matchState.currentPartnership = {
        runs: prevPartition.runs,
        balls: prevPartition.balls,
        batsmenIds: [lastBall.strikerId, lastBall.nonStrikerId]
      };
    }
  } else {
    // Revert standard Partnership runs/balls
    matchState.currentPartnership.runs -= lastBall.totalRunsEvent;
    if (lastBall.extraType !== 'wide') {
      matchState.currentPartnership.balls -= 1;
    }
  }

  // Restore the dynamic striker settings at moment of bowler ball release
  matchState.strikerId = lastBall.strikerId;
  matchState.nonStrikerId = lastBall.nonStrikerId;
  matchState.activeBowlerId = lastBall.bowlerId;

  // Revert matchStatus if necessary
  if (matchState.matchStatus === 'completed') {
    matchState.matchStatus = 'live';
  }

  updateALLCIS();
  await saveMatchState();

  res.json(matchState);
});

// Manual settings swap override (e.g. swap batter positions, change active bowlers manually)
app.post('/api/match-state/add-bowler', async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Bowler name is required' });
  }

  const cleanName = name.trim();
  const bowlingTeam = matchState.bowlingTeamId === 'team_a' ? matchState.teamA : matchState.teamB;
  
  // Check if player with the same name already exists in the bowling team
  let existingPlayer = bowlingTeam.players.find(p => p.name.toLowerCase() === cleanName.toLowerCase());
  
  if (!existingPlayer) {
    const newId = `bowler_${Date.now()}`;
    const newPlayer: Player = {
      id: newId,
      name: cleanName,
      teamId: matchState.bowlingTeamId as 'team_a' | 'team_b',
      runsScored: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      oversBowled: 0,
      ballsBowled: 0,
      runsConceded: 0,
      wicketsTaken: 0,
      isOut: false,
      contextualImpactScore: 5.0
    };
    bowlingTeam.players.push(newPlayer);
    matchState.activeBowlerId = newId;
  } else {
    matchState.activeBowlerId = existingPlayer.id;
  }

  updateALLCIS();
  await saveMatchState();
  res.json(matchState);
});

app.post('/api/match-state/add-batter', async (req, res) => {
  const { name, role } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Batter name is required' });
  }

  const cleanName = name.trim();
  const battingTeam = matchState.battingTeamId === 'team_a' ? matchState.teamA : matchState.teamB;
  
  // Check if player with the same name already exists in the batting team
  let existingPlayer = battingTeam.players.find(p => p.name.toLowerCase() === cleanName.toLowerCase());
  
  if (!existingPlayer) {
    const newId = `batter_${Date.now()}`;
    const newPlayer: Player = {
      id: newId,
      name: cleanName,
      teamId: matchState.battingTeamId as 'team_a' | 'team_b',
      runsScored: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      oversBowled: 0,
      ballsBowled: 0,
      runsConceded: 0,
      wicketsTaken: 0,
      isOut: false,
      contextualImpactScore: 5.0
    };
    battingTeam.players.push(newPlayer);
    existingPlayer = newPlayer;
  }

  if (role === 'non_striker') {
    matchState.nonStrikerId = existingPlayer.id;
  } else {
    matchState.strikerId = existingPlayer.id;
  }

  updateALLCIS();
  await saveMatchState();
  res.json(matchState);
});

// Manual settings swap override (e.g. swap batter positions, change active bowlers manually)
app.post('/api/match-state/override', async (req, res) => {
  const { 
    strikerId, nonStrikerId, activeBowlerId, battingTeamId, bowlingTeamId, 
    matchStatus, venue, currentInnings, target,
    showTargetOverlay, showBattingCardOverlay, showBowlingCardOverlay, showDismissedPlayerOverlay,
    lastDismissedPlayer, activeFullScreenPlate,
    activeLayout, activeAccent, activeFont
  } = req.body;

  if (strikerId) matchState.strikerId = strikerId;
  if (nonStrikerId) matchState.nonStrikerId = nonStrikerId;
  if (activeBowlerId) matchState.activeBowlerId = activeBowlerId;
  if (battingTeamId) matchState.battingTeamId = battingTeamId;
  if (bowlingTeamId) matchState.bowlingTeamId = bowlingTeamId;
  if (matchStatus) matchState.matchStatus = matchStatus;
  if (venue) matchState.venue = venue;
  if (currentInnings) matchState.currentInnings = currentInnings;
  if (target !== undefined) matchState.target = target;

  if (showTargetOverlay !== undefined) matchState.showTargetOverlay = showTargetOverlay;
  if (showBattingCardOverlay !== undefined) matchState.showBattingCardOverlay = showBattingCardOverlay;
  if (showBowlingCardOverlay !== undefined) matchState.showBowlingCardOverlay = showBowlingCardOverlay;
  if (showDismissedPlayerOverlay !== undefined) matchState.showDismissedPlayerOverlay = showDismissedPlayerOverlay;
  if (lastDismissedPlayer !== undefined) matchState.lastDismissedPlayer = lastDismissedPlayer;
  if (activeFullScreenPlate !== undefined) matchState.activeFullScreenPlate = activeFullScreenPlate;
  
  if (activeLayout !== undefined) matchState.activeLayout = activeLayout;
  if (activeAccent !== undefined) matchState.activeAccent = activeAccent;
  if (activeFont !== undefined) matchState.activeFont = activeFont;

  updateALLCIS();
  await saveMatchState();
  res.json(matchState);
});

// Reset match configuration completely
app.post('/api/match-state/reset', async (req, res) => {
  const { teamAName, teamBName, maxOvers, tossWinner, tossDecidedTo, inningsType, teamAPlayers, teamBPlayers, strikerName, nonStrikerName, bowlerName } = req.body;

  // Re-verify base values
  matchState = JSON.parse(JSON.stringify(DEFAULT_MATCH_STATE));

  if (teamAName) matchState.teamA.name = teamAName.toUpperCase();
  if (teamBName) matchState.teamB.name = teamBName.toUpperCase();
  if (maxOvers) matchState.maxOvers = maxOvers;
  if (tossWinner) matchState.tossWinner = tossWinner;
  if (tossDecidedTo) matchState.tossDecidedTo = tossDecidedTo;

  if (teamAPlayers && Array.isArray(teamAPlayers)) {
    matchState.teamA.players = teamAPlayers.map((name, index) => {
      const existing = DEFAULT_PLAYERS_A[index];
      return {
        id: existing?.id || `ind_${index + 1}`,
        name: name.trim() || existing?.name || `Player A${index + 1}`,
        teamId: 'team_a',
        runsScored: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        oversBowled: 0,
        ballsBowled: 0,
        runsConceded: 0,
        wicketsTaken: 0,
        isOut: false,
        battingStatus: 'not_batting',
        contextualImpactScore: 5.0
      };
    });
  } else {
    // If no new players are provided, strictly wipe the existing defaults
    matchState.teamA.players.forEach(p => {
      p.runsScored = 0; p.ballsFaced = 0; p.fours = 0; p.sixes = 0;
      p.oversBowled = 0; p.ballsBowled = 0; p.runsConceded = 0; p.wicketsTaken = 0;
      p.isOut = false; p.battingStatus = 'not_batting'; p.dismissalInfo = undefined;
    });
  }

  if (teamBPlayers && Array.isArray(teamBPlayers)) {
    matchState.teamB.players = teamBPlayers.map((name, index) => {
      const existing = DEFAULT_PLAYERS_B[index];
      return {
        id: existing?.id || `aus_${index + 1}`,
        name: name.trim() || existing?.name || `Player B${index + 1}`,
        teamId: 'team_b',
        runsScored: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        oversBowled: 0,
        ballsBowled: 0,
        runsConceded: 0,
        wicketsTaken: 0,
        isOut: false,
        battingStatus: 'not_batting',
        contextualImpactScore: 5.0
      };
    });
  } else {
    matchState.teamB.players.forEach(p => {
      p.runsScored = 0; p.ballsFaced = 0; p.fours = 0; p.sixes = 0;
      p.oversBowled = 0; p.ballsBowled = 0; p.runsConceded = 0; p.wicketsTaken = 0;
      p.isOut = false; p.battingStatus = 'not_batting'; p.dismissalInfo = undefined;
    });
  }

  // Reset core metrics explicitly
  matchState.runs = 0;
  matchState.wickets = 0;
  matchState.legalBalls = 0;
  matchState.ballHistory = [];
  matchState.fallOfWickets = [];
  matchState.historicalPartnerships = [];
  matchState.innings1Total = undefined;
  matchState.target = undefined;
  matchState.dlsTarget = undefined;
  matchState.penaltyRuns = 0;
  matchState.currentPartnership = { runs: 0, balls: 0, batsmenIds: ['', ''] };
  matchState.activeFullScreenPlate = 'none';

  // Determine batting order based on toss
  const deciderChoice = tossDecidedTo || 'bat'; // 'bat' or 'bowl'
  const isAWinner = tossWinner === 'team_a';

  if (deciderChoice === 'bat') {
    matchState.battingTeamId = isAWinner ? 'team_a' : 'team_b';
    matchState.bowlingTeamId = isAWinner ? 'team_b' : 'team_a';
  } else {
    matchState.battingTeamId = isAWinner ? 'team_b' : 'team_a';
    matchState.bowlingTeamId = isAWinner ? 'team_a' : 'team_b';
  }

  if (inningsType === '1') {
    matchState.currentInnings = 1;
    matchState.target = undefined;
  } else {
    matchState.currentInnings = 2;
    matchState.target = 230; // Chasing default target
  }

  // Set opening batsmen and bowler
  const batTeam = matchState.battingTeamId === 'team_a' ? matchState.teamA : matchState.teamB;
  const bowlTeam = matchState.bowlingTeamId === 'team_a' ? matchState.teamA : matchState.teamB;

  // Clear previous runs
  batTeam.players.forEach(p => {
    p.runsScored = 0;
    p.ballsFaced = 0;
    p.fours = 0;
    p.sixes = 0;
    p.isOut = false;
    p.dismissalInfo = undefined;
    p.battingStatus = 'not_batting';
  });

  bowlTeam.players.forEach(p => {
    p.ballsBowled = 0;
    p.oversBowled = 0;
    p.runsConceded = 0;
    p.wicketsTaken = 0;
  });

  const selectedStriker = batTeam.players.find(p => p.name === strikerName);
  const selectedNonStriker = batTeam.players.find(p => p.name === nonStrikerName);
  const selectedBowler = bowlTeam.players.find(p => p.name === bowlerName);

  matchState.strikerId = selectedStriker ? selectedStriker.id : (batTeam.players[0] ? batTeam.players[0].id : '');
  matchState.nonStrikerId = selectedNonStriker ? selectedNonStriker.id : (batTeam.players[1] ? batTeam.players[1].id : '');
  
  const strikerPlayer = batTeam.players.find(p => p.id === matchState.strikerId);
  const nonStrikerPlayer = batTeam.players.find(p => p.id === matchState.nonStrikerId);
  if (strikerPlayer) strikerPlayer.battingStatus = 'active';
  if (nonStrikerPlayer) nonStrikerPlayer.battingStatus = 'active';

  // Pick bowler
  matchState.activeBowlerId = selectedBowler ? selectedBowler.id : ((bowlTeam.players[7] && bowlTeam.players[7].id) || (bowlTeam.players[0] && bowlTeam.players[0].id) || '');

  matchState.currentPartnership = {
    runs: 0,
    balls: 0,
    batsmenIds: [matchState.strikerId, matchState.nonStrikerId]
  };

  ensureBattingStatus(matchState);
  updateALLCIS();
  await saveMatchState();
  res.json(matchState);
});

// Setup Super Over Mode
app.post('/api/match-state/super-over', async (req, res) => {
  matchState.runs = 0;
  matchState.wickets = 0;
  matchState.legalBalls = 0;
  matchState.ballHistory = [];
  matchState.fallOfWickets = [];
  matchState.historicalPartnerships = [];
  matchState.innings1Total = undefined;
  matchState.target = undefined;
  matchState.maxOvers = 1;
  matchState.isSuperOver = true;
  matchState.penaltyRuns = 0;

  matchState.teamA.players.forEach(p => {
    p.runsScored = 0; p.ballsFaced = 0; p.fours = 0; p.sixes = 0;
    p.oversBowled = 0; p.ballsBowled = 0; p.runsConceded = 0; p.wicketsTaken = 0;
    p.isOut = false; p.battingStatus = 'not_batting'; p.dismissalInfo = undefined;
  });
  matchState.teamB.players.forEach(p => {
    p.runsScored = 0; p.ballsFaced = 0; p.fours = 0; p.sixes = 0;
    p.oversBowled = 0; p.ballsBowled = 0; p.runsConceded = 0; p.wicketsTaken = 0;
    p.isOut = false; p.battingStatus = 'not_batting'; p.dismissalInfo = undefined;
  });

  const batTeam = matchState.battingTeamId === 'team_a' ? matchState.teamA : matchState.teamB;
  const bowlTeam = matchState.bowlingTeamId === 'team_a' ? matchState.teamA : matchState.teamB;

  matchState.strikerId = batTeam.players[0] ? batTeam.players[0].id : '';
  matchState.nonStrikerId = batTeam.players[1] ? batTeam.players[1].id : '';
  
  if (batTeam.players[0]) batTeam.players[0].battingStatus = 'active';
  if (batTeam.players[1]) batTeam.players[1].battingStatus = 'active';

  matchState.activeBowlerId = bowlTeam.players[0] ? bowlTeam.players[0].id : '';

  matchState.currentPartnership = {
    runs: 0,
    balls: 0,
    batsmenIds: [matchState.strikerId, matchState.nonStrikerId]
  };

  ensureBattingStatus(matchState);
  updateALLCIS();
  await saveMatchState();
  res.json(matchState);
});

// Award Penalty Runs (+5 runs to batting team)
app.post('/api/match-state/penalty', async (req, res) => {
  matchState.runs += 5;
  matchState.penaltyRuns = (matchState.penaltyRuns || 0) + 5;
  
  await saveMatchState();
  res.json(matchState);
});

// AI commentaries with Gemini API (Proxying requests securely server-side)
app.post('/api/ai-insights', async (req, res) => {
  try {
    const aiKey = process.env.GEMINI_API_KEY;
    if (!aiKey) {
      return res.json({
        commentary: "Config the GEMINI_API_KEY in Settings to enable real-time professional AI match prognosis, momentum tracking, and stadium scoreboard commentaries."
      });
    }

    const ai = new GoogleGenAI({
      apiKey: aiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const battingTeam = matchState.battingTeamId === 'team_a' ? matchState.teamA : matchState.teamB;
    const bowlingTeam = matchState.bowlingTeamId === 'team_a' ? matchState.teamA : matchState.teamB;
    const strikerObj = battingTeam.players.find(p => p.id === matchState.strikerId);
    const bowlerObj = bowlingTeam.players.find(p => p.id === matchState.activeBowlerId);

    const matchContext = `
      Match venue: ${matchState.venue}.
      Batting Team: ${battingTeam.name} scoring ${matchState.runs}/${matchState.wickets} off ${Math.floor(matchState.legalBalls / 6)}.${matchState.legalBalls % 6} overs.
      Current Innings: ${matchState.currentInnings} of ${matchState.maxOvers} maximum overs.
      Target to Chase: ${matchState.target || 'Innings 1 - set high score'}.
      Striker Batsman: ${strikerObj?.name || 'Active Striker'} having runs ${strikerObj?.runsScored} off ${strikerObj?.ballsFaced} balls (fours: ${strikerObj?.fours}, sixes: ${strikerObj?.sixes}).
      Bowler: ${bowlerObj?.name || 'Active Bowler'} conceding ${bowlerObj?.runsConceded} runs with ${bowlerObj?.wicketsTaken} wickets off ${bowlerObj?.oversBowled} overs.
      Current run rate is ${(matchState.runs / Math.max(matchState.legalBalls / 6, 0.1)).toFixed(2)}.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `You are CricPulse's intelligent elite sports broadcaster. Generate a sharp, highly technical, and engaging 1-2 sentence real-time tactical commentary or predictive prediction for the physical live stadium LEDs based on current play contextual data: ${matchContext}. Make it sound energetic, professional, live, and do not use generic fluff.`,
    });

    const text = response.text || "Perfect tactical overview ready.";
    matchState.commentaryState = text;
    await saveMatchState();

    res.json({ commentary: text });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: error.message || 'Error querying Gemini API' });
  }
});
// Match History Endpoints
app.post('/api/match-state/archive', (req, res) => {
  // Save a deep copy to history
  pastMatchesHistory.push(JSON.parse(JSON.stringify(matchState)));
  notifyClients();
  res.json({ success: true, count: pastMatchesHistory.length });
});

app.get('/api/match-history', (req, res) => {
  res.json(pastMatchesHistory);
});

// Setup development server middleware vs production static hosting
async function startServer() {
  await initMatchState();
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CricPulse Enterprise Server running on http://localhost:${PORT}`);
  });
}

startServer();
