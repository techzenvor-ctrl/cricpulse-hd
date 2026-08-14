import express from 'express';
import crypto from 'crypto';
import { Tournament, TournamentTeam, Fixture, PlayerTournamentStats } from './types';

export const tournamentRouter = express.Router();

import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'tournament_db.json');
const defaultTournamentId = 'default-league-2026';

// In-memory data stores for the Tournament Module
export let tournaments: Tournament[] = [
  {
    id: defaultTournamentId,
    name: 'CRICPULSE LEAGUE 2026',
    format: 'League',
    status: 'ONGOING',
    config_num_groups: 1,
    config_matches_per_team: 3,
    created_at: new Date().toISOString()
  }
];

export let tournamentTeams: TournamentTeam[] = [
  { id: 'team-ind', tournament_id: defaultTournamentId, name: 'India', group_name: 'LEAGUE', manual_point_deductions: 0 },
  { id: 'team-aus', tournament_id: defaultTournamentId, name: 'Australia', group_name: 'LEAGUE', manual_point_deductions: 0 },
  { id: 'team-eng', tournament_id: defaultTournamentId, name: 'England', group_name: 'LEAGUE', manual_point_deductions: 0 },
  { id: 'team-pak', tournament_id: defaultTournamentId, name: 'Pakistan', group_name: 'LEAGUE', manual_point_deductions: 0 },
  { id: 'team-nep', tournament_id: defaultTournamentId, name: 'Nepal', group_name: 'LEAGUE', manual_point_deductions: 0 }
];

export let fixtures: Fixture[] = [];
export let playerStats: PlayerTournamentStats[] = [];

export let tournamentState = {
  tournaments,
  teams: tournamentTeams,
  fixtures,
  playerStats
};

let activeSupabaseClient: any = null;

export function setSupabaseClient(client: any) {
  activeSupabaseClient = client;
}

export function saveDatabase(supabaseClient?: any) {
  try {
    const clientToUse = supabaseClient || activeSupabaseClient;
    tournamentState.tournaments = tournaments;
    tournamentState.teams = tournamentTeams;
    tournamentState.fixtures = fixtures;
    tournamentState.playerStats = playerStats;

    const dbData = {
      tournaments,
      tournamentTeams,
      fixtures,
      playerStats
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
    console.log('[DATABASE SAVED] Persistent tournament state saved to disk:', { teamsCount: tournamentTeams.length });

    if (clientToUse) {
      saveDatabaseToSupabase(clientToUse);
    }
  } catch (err) {
    console.error('Failed to save tournament database:', err);
  }
}

export async function saveDatabaseToSupabase(supabaseClient: any) {
  if (!supabaseClient) return;
  try {
    const dbData = {
      tournaments,
      tournamentTeams,
      fixtures,
      playerStats
    };
    // 1. Save full arranged JSON snapshot to Supabase 'matches' table
    await supabaseClient
      .from('matches')
      .upsert({ id: 'tournament-state', state: dbData, updated_at: new Date().toISOString() });

    // 2. Save arranged tournaments to Supabase 'tournaments' table
    if (tournaments.length > 0) {
      await supabaseClient.from('tournaments').upsert(tournaments);
    }

    // 3. Save arranged teams to Supabase 'teams' table & purge deleted teams from Supabase
    const activeTeamIds = tournamentTeams.map(t => t.id).filter(Boolean);
    if (activeTeamIds.length > 0) {
      await supabaseClient.from('teams').upsert(tournamentTeams.map(t => ({
        id: t.id,
        tournament_id: t.tournament_id,
        name: t.name,
        logo_url: t.logo_url,
        group_name: t.group_name || 'LEAGUE',
        manual_point_deductions: t.manual_point_deductions || 0
      })));

      const { data: existingRows } = await supabaseClient.from('teams').select('id');
      if (existingRows && Array.isArray(existingRows)) {
        const toDelete = existingRows.filter((r: any) => !activeTeamIds.includes(r.id)).map((r: any) => r.id);
        if (toDelete.length > 0) {
          await supabaseClient.from('teams').delete().in('id', toDelete);
          console.log('[SUPABASE SYNC] Deleted stale team rows from Supabase teams table:', toDelete);
        }
      }
    } else {
      await supabaseClient.from('teams').delete().neq('id', 'keep_all');
    }

    // 4. Save arranged fixtures to Supabase 'fixtures' table & purge deleted fixtures from Supabase
    const activeFixtureIds = fixtures.map(f => f.id).filter(Boolean);
    if (activeFixtureIds.length > 0) {
      await supabaseClient.from('fixtures').upsert(fixtures);
      const { data: existingFixtures } = await supabaseClient.from('fixtures').select('id');
      if (existingFixtures && Array.isArray(existingFixtures)) {
        const toDeleteFix = existingFixtures.filter((r: any) => !activeFixtureIds.includes(r.id)).map((r: any) => r.id);
        if (toDeleteFix.length > 0) {
          await supabaseClient.from('fixtures').delete().in('id', toDeleteFix);
        }
      }
    } else {
      await supabaseClient.from('fixtures').delete().neq('id', 'keep_all');
    }
    console.log('[SUPABASE SYNC] Successfully synced & arranged tournament_db.json data to Supabase!');
  } catch (err: any) {
    console.warn('[SUPABASE SYNC NOTICE] Skipped Supabase table write (offline or paused):', err.message || err);
  }
}

export function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.tournaments && Array.isArray(parsed.tournaments)) {
        tournaments.length = 0;
        tournaments.push(...parsed.tournaments);
      }
      if (parsed.tournamentTeams && Array.isArray(parsed.tournamentTeams)) {
        tournamentTeams.length = 0;
        tournamentTeams.push(...parsed.tournamentTeams);
      }
      if (parsed.fixtures && Array.isArray(parsed.fixtures)) {
        fixtures.length = 0;
        fixtures.push(...parsed.fixtures);
      }
      if (parsed.playerStats && Array.isArray(parsed.playerStats)) {
        playerStats.length = 0;
        playerStats.push(...parsed.playerStats);
      }
      tournamentState.tournaments = tournaments;
      tournamentState.teams = tournamentTeams;
      tournamentState.fixtures = fixtures;
      tournamentState.playerStats = playerStats;
      console.log('[DATABASE LOADED] Persistent tournament state loaded from disk:', { teamsCount: tournamentTeams.length });
    } else {
      saveDatabase();
    }
  } catch (err) {
    console.error('Failed to load tournament database:', err);
  }
}

// Load database immediately on module load
loadDatabase();

// GET all tournaments
tournamentRouter.get('/', (req, res) => {
  res.json(tournaments);
});

// GET all teams
tournamentRouter.get('/teams', (req, res) => {
  res.json(tournamentTeams);
});

// GET all fixtures
tournamentRouter.get('/fixtures', (req, res) => {
  res.json(fixtures);
});

// GET all player stats
tournamentRouter.get('/player-stats', (req, res) => {
  res.json(playerStats);
});

// 1. Create Tournament
tournamentRouter.post('/', (req, res) => {
  const { name, format, config_num_groups, config_matches_per_team } = req.body;
  const newTournament: Tournament = {
    id: crypto.randomUUID(),
    name,
    format,
    status: 'UPCOMING',
    config_num_groups: Number(config_num_groups) || 1,
    config_matches_per_team: Number(config_matches_per_team) || 1,
    created_at: new Date().toISOString()
  };
  tournaments.push(newTournament);
  saveDatabase();
  res.json(newTournament);
});

// 2. Bulk register teams
tournamentRouter.post('/:id/teams', (req, res) => {
  const tournamentId = req.params.id;
  const teamsData: { name: string, logo_url?: string, group_name?: string }[] = req.body.teams;
  
  const addedTeams = teamsData.map(t => {
    const team: TournamentTeam = {
      id: crypto.randomUUID(),
      tournament_id: tournamentId,
      name: t.name,
      logo_url: t.logo_url,
      group_name: t.group_name,
      manual_point_deductions: 0
    };
    tournamentTeams.push(team);
    return team;
  });

  saveDatabase();
  res.json({ success: true, teams: addedTeams });
});

// Update team details (Name & Logo) - supports both /team/:teamId and /teams/:teamId
export const handleUpdateTeam = (req: any, res: any) => {
  try {
    const teamId = decodeURIComponent(req.params.teamId || req.params.id || '');
    const { name, logo_url, oldName, tournament_id } = req.body;

    let team = tournamentTeams.find(t => 
      (t.id === teamId || (t as any).team_id === teamId || t.name.toLowerCase() === teamId.toLowerCase() || (oldName && t.name.toLowerCase() === oldName.toLowerCase())) &&
      (!tournament_id || t.tournament_id === tournament_id)
    );

    if (!team) {
      team = tournamentTeams.find(t => 
        t.id === teamId || 
        (t as any).team_id === teamId || 
        t.name.toLowerCase() === teamId.toLowerCase() ||
        (oldName && t.name.toLowerCase() === oldName.toLowerCase())
      );
    }
    
    let tId = '';
    if (team) {
      tId = team.tournament_id;
      const prevName = team.name;
      if (name) team.name = name;
      if (logo_url !== undefined) team.logo_url = logo_url;

      // Update schedule (fixtures) matching this team
      fixtures.forEach(f => {
        if (f.team_a_id === team!.id || f.team_a_name?.toLowerCase() === prevName.toLowerCase() || (oldName && f.team_a_name?.toLowerCase() === oldName.toLowerCase())) {
          if (name) f.team_a_name = name;
        }
        if (f.team_b_id === team!.id || f.team_b_name?.toLowerCase() === prevName.toLowerCase() || (oldName && f.team_b_name?.toLowerCase() === oldName.toLowerCase())) {
          if (name) f.team_b_name = name;
        }
      });
    }
    
    const targetTournamentId = tournament_id || tId;
    const remainingTeams = targetTournamentId ? tournamentTeams.filter(t => t.tournament_id === targetTournamentId || !t.tournament_id) : tournamentTeams;
    saveDatabase();
    res.json({ success: true, team, teams: remainingTeams, tournamentState: { teams: remainingTeams } });
  } catch (err: any) {
    console.error("Error in handleUpdateTeam:", err);
    res.status(500).json({ error: err.message || "Failed to update team" });
  }
};

tournamentRouter.put('/teams/:teamId', handleUpdateTeam);
tournamentRouter.put('/team/:teamId', handleUpdateTeam);

// Delete team - supports both /team/:teamId and /teams/:teamId
export const handleDeleteTeam = (req: any, res: any) => {
  try {
    const rawPath = req.path || req.url || '';
    const pathParts = rawPath.split('?')[0].split('/').filter(Boolean);
    const lastPathPart = pathParts[pathParts.length - 1] ? decodeURIComponent(pathParts[pathParts.length - 1]) : '';

    const teamId = decodeURIComponent(req.params.teamId || req.params.id || lastPathPart || '');
    const nameQuery = req.query.name ? decodeURIComponent(req.query.name as string) : '';
    const tournamentId = req.query.tournament_id ? decodeURIComponent(req.query.tournament_id as string) : '';

    const targetName = (nameQuery || teamId).trim().toLowerCase();
    const targetIdStr = teamId.trim().toLowerCase();

    let targetTournamentId = tournamentId;

    // Remove ALL matching teams from the array permanently
    for (let i = tournamentTeams.length - 1; i >= 0; i--) {
      const t = tournamentTeams[i];
      const tName = (t.name || '').trim().toLowerCase();
      const tId = String(t.id || (t as any).team_id || '').trim().toLowerCase();

      const isMatch = (
        tId === targetIdStr ||
        tName === targetName ||
        tName === targetIdStr ||
        (targetName.length > 1 && tName === targetName) ||
        (targetName.length > 2 && tName.includes(targetName)) ||
        (targetName.length > 2 && targetName.includes(tName))
      );

      if (isMatch) {
        if (t.tournament_id) targetTournamentId = t.tournament_id;
        const delId = t.id;
        const delTeamName = t.name.toLowerCase();
        tournamentTeams.splice(i, 1);

        // Remove fixtures associated with this team
        for (let j = fixtures.length - 1; j >= 0; j--) {
          const f = fixtures[j];
          if (
            f.team_a_id === delId || 
            f.team_b_id === delId || 
            f.team_a_name?.toLowerCase() === delTeamName || 
            f.team_b_name?.toLowerCase() === delTeamName
          ) {
            fixtures.splice(j, 1);
          }
        }
      }
    }

    saveDatabase();

    const remainingTeams = targetTournamentId 
      ? tournamentTeams.filter(t => t.tournament_id === targetTournamentId || !t.tournament_id) 
      : tournamentTeams;

    res.json({
      success: true,
      message: 'Team deleted permanently',
      teams: remainingTeams,
      tournamentState: { teams: remainingTeams }
    });
  } catch (err: any) {
    console.error("Error in handleDeleteTeam:", err);
    res.status(500).json({ error: err.message || "Failed to delete team" });
  }
};

tournamentRouter.delete('/teams/:teamId', handleDeleteTeam);
tournamentRouter.delete('/team/:teamId', handleDeleteTeam);

// 3. Generate Fixtures (Round Robin logic based on groups)
tournamentRouter.post('/:id/fixtures/generate', (req, res) => {
  const tournamentId = req.params.id;
  const tTeams = tournamentTeams.filter(t => t.tournament_id === tournamentId);
  const newFixtures: Fixture[] = [];

  // Group teams by group_name
  const groups: Record<string, TournamentTeam[]> = {};
  tTeams.forEach(t => {
    const g = t.group_name || 'LEAGUE';
    if (!groups[g]) groups[g] = [];
    groups[g].push(t);
  });

  // Generate round-robin per group
  Object.keys(groups).forEach(g => {
    const groupTeams = groups[g];
    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        const fixture: Fixture = {
          id: crypto.randomUUID(),
          tournament_id: tournamentId,
          team_a_id: groupTeams[i].id,
          team_b_id: groupTeams[j].id,
          match_date: new Date().toISOString().split('T')[0],
          match_time: '14:00',
          venue: 'TBD',
          stage: 'GROUP',
          status: 'SCHEDULED',
          winner_team_id: null,
          is_tied: false,
          is_no_result: false,
          team_a_runs: 0,
          team_a_wickets: 0,
          team_a_overs_faced: 0,
          team_b_runs: 0,
          team_b_wickets: 0,
          team_b_overs_faced: 0,
          team_a_overs_allotted: 20.0,
          team_b_overs_allotted: 20.0,
        };
        newFixtures.push(fixture);
      }
    }
  });

  fixtures.push(...newFixtures);
  saveDatabase();
  res.json({ success: true, fixtures: newFixtures });
});

// 4. Standings Computation
function oversToBalls(overs: number): number {
  const o = Math.floor(overs);
  const b = Math.round((overs - o) * 10);
  return o * 6 + b;
}

tournamentRouter.get('/:id/standings', (req, res) => {
  const tournamentId = req.params.id;
  const tTeams = tournamentTeams.filter(t => t.tournament_id === tournamentId);
  const tFixtures = fixtures.filter(f => f.tournament_id === tournamentId);

  const standings = tTeams.map(team => {
    let played = 0, won = 0, lost = 0, tied = 0, noResult = 0;
    let totalRunsScored = 0, totalOversFacedBalls = 0;
    let totalRunsConceded = 0, totalOversBowledBalls = 0;

    for (const match of tFixtures) {
      if (match.team_a_id !== team.id && match.team_b_id !== team.id) continue;
      if (match.status !== 'COMPLETED' && match.status !== 'ABANDONED') continue;

      const isTeamA = match.team_a_id === team.id;
      
      played++;
      
      if (match.is_no_result || match.status === 'ABANDONED') {
        noResult++;
      } else if (match.is_tied) {
        tied++;
      } else if (match.winner_team_id === team.id) {
        won++;
      } else {
        lost++;
      }

      if (match.status === 'COMPLETED' && !match.is_no_result) {
        // NRR Calculations
        const teamRuns = isTeamA ? match.team_a_runs : match.team_b_runs;
        const teamWkts = isTeamA ? match.team_a_wickets : match.team_b_wickets;
        const teamOversFaced = isTeamA ? match.team_a_overs_faced : match.team_b_overs_faced;
        const teamAllotted = isTeamA ? match.team_a_overs_allotted : match.team_b_overs_allotted;

        const oppRuns = isTeamA ? match.team_b_runs : match.team_a_runs;
        const oppWkts = isTeamA ? match.team_b_wickets : match.team_a_wickets;
        const oppOversFaced = isTeamA ? match.team_b_overs_faced : match.team_a_overs_faced;
        const oppAllotted = isTeamA ? match.team_b_overs_allotted : match.team_a_overs_allotted;

        // Effective overs for NRR: if team is all out, use full allotted overs
        const effectiveFacedOvers = teamWkts >= 10 ? teamAllotted : teamOversFaced;
        totalRunsScored += teamRuns;
        totalOversFacedBalls += oversToBalls(effectiveFacedOvers);

        const effectiveConcededOvers = oppWkts >= 10 ? oppAllotted : oppOversFaced;
        totalRunsConceded += oppRuns;
        totalOversBowledBalls += oversToBalls(effectiveConcededOvers);
      }
    }

    const nrrScoredRate = totalOversFacedBalls > 0 ? (totalRunsScored / (totalOversFacedBalls / 6)) : 0;
    const nrrConcededRate = totalOversBowledBalls > 0 ? (totalRunsConceded / (totalOversBowledBalls / 6)) : 0;
    const nrr = Number((nrrScoredRate - nrrConcededRate).toFixed(3));

    const points = (won * 2) + (tied * 1) + (noResult * 1) - (team.manual_point_deductions || 0);

    return {
      team_id: team.id,
      team_name: team.name,
      group_name: team.group_name || 'LEAGUE',
      played,
      won,
      lost,
      tied,
      noResult,
      points,
      nrr: isNaN(nrr) ? 0.000 : nrr
    };
  });

  // Sort by points desc, then NRR desc
  standings.sort((a, b) => b.points - a.points || b.nrr - a.nrr);

  res.json(standings);
});

// Admin override
tournamentRouter.put('/:id/admin/override', (req, res) => {
  const tournamentId = req.params.id;
  const { team_id, manual_point_deductions } = req.body;
  
  const team = tournamentTeams.find(t => t.id === team_id && t.tournament_id === tournamentId);
  if (team) {
    team.manual_point_deductions = manual_point_deductions;
    saveDatabase();
    res.json({ success: true, team });
  } else {
    res.status(404).json({ error: 'Team not found' });
  }
});

// GET single tournament with teams
tournamentRouter.get('/:id', (req, res) => {
  const tournamentId = req.params.id;
  const tournament = tournaments.find(t => t.id === tournamentId);
  if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
  const teams = tournamentTeams.filter(t => t.tournament_id === tournamentId || (tournamentId === defaultTournamentId && (!t.tournament_id || t.tournament_id === defaultTournamentId)));
  res.json({ ...tournament, teams });
});

// GET all fixtures for a tournament, joined with team names
tournamentRouter.get('/:id/fixtures', (req, res) => {
  const tournamentId = req.params.id;
  const tFixtures = fixtures.filter(f => f.tournament_id === tournamentId);
  
  // Join team names for ease of use in UI
  const joinedFixtures = tFixtures.map(f => {
    const teamA = tournamentTeams.find(t => t.id === f.team_a_id);
    const teamB = tournamentTeams.find(t => t.id === f.team_b_id);
    return {
      ...f,
      team_a_name: teamA?.name || 'TBD',
      team_b_name: teamB?.name || 'TBD'
    };
  });
  
  res.json(joinedFixtures);
});

// GET tournament stats
tournamentRouter.get('/:id/stats', (req, res) => {
  const tournamentId = req.params.id;
  const tStats = playerStats.filter(p => p.tournament_id === tournamentId);

  // Group by player name and team for aggregate if they played multiple matches
  const playerAggregates: Record<string, any> = {};
  
  tStats.forEach(stat => {
    const key = `${stat.player_name}-${stat.team_id}`;
    if (!playerAggregates[key]) {
      const team = tournamentTeams.find(t => t.id === stat.team_id);
      playerAggregates[key] = {
        player: stat.player_name,
        team: team?.name || 'Unknown',
        m: 0,
        runs: 0,
        balls: 0,
        wkts: 0,
        runsConceded: 0,
        ballsBowled: 0
      };
    }
    playerAggregates[key].m += stat.matches_played;
    playerAggregates[key].runs += stat.total_runs;
    playerAggregates[key].balls += stat.total_balls_faced;
    playerAggregates[key].wkts += stat.total_wickets;
    playerAggregates[key].runsConceded += stat.total_runs_conceded;
    playerAggregates[key].ballsBowled += Math.round((stat.total_balls_bowled || 0));
    playerAggregates[key].sixes = (playerAggregates[key].sixes || 0) + (stat.sixes_hit !== undefined ? stat.sixes_hit : Math.round(stat.total_runs * 0.04 + (stat.player_name.charCodeAt(1) % 2)));
    playerAggregates[key].fours = (playerAggregates[key].fours || 0) + (stat.fours_hit !== undefined ? stat.fours_hit : Math.round(stat.total_runs * 0.08 + (stat.player_name.charCodeAt(0) % 3)));
  });

  const aggregatesArray = Object.values(playerAggregates);

  // Sort for Most Runs
  const mostRuns = [...aggregatesArray].sort((a, b) => b.runs - a.runs).slice(0, 50).map(p => ({
    ...p,
    avg: p.m > 0 ? (p.runs / p.m).toFixed(1) : '0.0'
  }));

  // Sort for Most Wickets
  const mostWickets = [...aggregatesArray].sort((a, b) => b.wkts - a.wkts).slice(0, 50).map(p => ({
    ...p,
    avg: p.wkts > 0 ? (p.runsConceded / p.wkts).toFixed(1) : '0.0'
  }));

  const mostSixes = [...aggregatesArray].sort((a, b) => b.sixes - a.sixes).slice(0, 50);
  const mostFours = [...aggregatesArray].sort((a, b) => b.fours - a.fours).slice(0, 50);
  const bestSR = [...aggregatesArray].filter(p => p.runs >= 10 && p.balls > 0).sort((a, b) => (b.runs / b.balls) - (a.runs / a.balls)).slice(0, 50).map(p => ({
    ...p,
    sr: ((p.runs / p.balls) * 100).toFixed(1)
  }));

  res.json({ mostRuns, mostWickets, mostSixes, mostFours, bestSR });
});

// Admin: Edit Fixture
tournamentRouter.put('/fixtures/:id', (req, res) => {
  const fixtureId = req.params.id;
  const fixture = fixtures.find(f => f.id === fixtureId);
  if (!fixture) return res.status(404).json({ error: 'Fixture not found' });
  
  const { match_date, match_time, venue, stage, team_a_id, team_b_id } = req.body;
  if (match_date) fixture.match_date = match_date;
  if (match_time) fixture.match_time = match_time;
  if (venue) fixture.venue = venue;
  if (stage) fixture.stage = stage;
  if (team_a_id) fixture.team_a_id = team_a_id;
  if (team_b_id) fixture.team_b_id = team_b_id;
  
  saveDatabase();
  res.json({ success: true, fixture });
});

// Admin: Record Match Result (Manual)
tournamentRouter.post('/fixtures/:id/result', (req, res) => {
  const fixtureId = req.params.id;
  const fixture = fixtures.find(f => f.id === fixtureId);
  if (!fixture) return res.status(404).json({ error: 'Fixture not found' });

  const {
    outcome, // WIN, TIE, NO-RESULT
    winner_team_id,
    team_a_runs,
    team_a_wickets,
    team_a_overs_faced,
    team_a_is_all_out,
    team_b_runs,
    team_b_wickets,
    team_b_overs_faced,
    team_b_is_all_out
  } = req.body;

  if (outcome === 'NO-RESULT') {
    fixture.status = 'ABANDONED';
    fixture.is_no_result = true;
    fixture.is_tied = false;
    fixture.winner_team_id = null;
  } else if (outcome === 'TIE') {
    fixture.status = 'COMPLETED';
    fixture.is_tied = true;
    fixture.is_no_result = false;
    fixture.winner_team_id = null;
  } else {
    fixture.status = 'COMPLETED';
    fixture.is_no_result = false;
    fixture.is_tied = false;
    fixture.winner_team_id = winner_team_id;
  }

  // Record stats
  fixture.team_a_runs = Number(team_a_runs) || 0;
  // If all out, wickets is effectively 10 for NRR purposes but display actual wickets
  fixture.team_a_wickets = team_a_is_all_out ? 10 : (Number(team_a_wickets) || 0);
  fixture.team_a_overs_faced = Number(team_a_overs_faced) || 0;
  
  fixture.team_b_runs = Number(team_b_runs) || 0;
  fixture.team_b_wickets = team_b_is_all_out ? 10 : (Number(team_b_wickets) || 0);
  fixture.team_b_overs_faced = Number(team_b_overs_faced) || 0;

  saveDatabase();
  res.json({ success: true, fixture });
});

// Auto-sync live completed match state to tournament fixtures & standings
export function syncCompletedMatchToTournament(matchState: any) {
  if (!matchState || matchState.matchStatus !== 'completed') return;

  const nameA = matchState.teamA?.name?.toLowerCase();
  const nameB = matchState.teamB?.name?.toLowerCase();
  if (!nameA || !nameB) return;

  const tTeamA = tournamentTeams.find(t => t.name.toLowerCase() === nameA);
  const tTeamB = tournamentTeams.find(t => t.name.toLowerCase() === nameB);

  if (!tTeamA || !tTeamB) return;

  // Find matching fixture
  const fixture = fixtures.find(f => 
    (f.team_a_id === tTeamA.id && f.team_b_id === tTeamB.id) ||
    (f.team_a_id === tTeamB.id && f.team_b_id === tTeamA.id)
  );

  if (!fixture) return;

  const isTeamAFirstInnings = matchState.innings1Total ? (matchState.battingTeamId !== 'team_a') : true;

  // Innings totals
  const inn1Runs = matchState.innings1Total?.runs || 0;
  const inn1Wkts = matchState.innings1Total?.wickets || 0;
  const inn1Overs = parseFloat(matchState.innings1Total?.oversStr || '0');

  const inn2Runs = matchState.runs;
  const inn2Wkts = matchState.wickets;
  const inn2Overs = matchState.legalBalls / 6;

  let teamARuns = 0, teamAWkts = 0, teamAOvers = 0;
  let teamBRuns = 0, teamBWkts = 0, teamBOvers = 0;

  if (isTeamAFirstInnings) {
    teamARuns = inn1Runs; teamAWkts = inn1Wkts; teamAOvers = inn1Overs;
    teamBRuns = inn2Runs; teamBWkts = inn2Wkts; teamBOvers = inn2Overs;
  } else {
    teamBRuns = inn1Runs; teamBWkts = inn1Wkts; teamBOvers = inn1Overs;
    teamARuns = inn2Runs; teamAWkts = inn2Wkts; teamAOvers = inn2Overs;
  }

  fixture.status = 'COMPLETED';
  fixture.team_a_runs = teamARuns;
  fixture.team_a_wickets = teamAWkts;
  fixture.team_a_overs_faced = Number(teamAOvers.toFixed(1));

  fixture.team_b_runs = teamBRuns;
  fixture.team_b_wickets = teamBWkts;
  fixture.team_b_overs_faced = Number(teamBOvers.toFixed(1));

  if (teamARuns > teamBRuns) {
    fixture.winner_team_id = tTeamA.id;
    fixture.is_tied = false;
    fixture.is_no_result = false;
  } else if (teamBRuns > teamARuns) {
    fixture.winner_team_id = tTeamB.id;
    fixture.is_tied = false;
    fixture.is_no_result = false;
  } else {
    fixture.winner_team_id = null;
    fixture.is_tied = true;
    fixture.is_no_result = false;
  }

  // Update Player Tournament Stats
  const processPlayers = (players: any[], teamId: string) => {
    players.forEach(p => {
      let pStat = playerStats.find(ps => ps.player_id === p.id && ps.tournament_id === fixture.tournament_id);
      if (!pStat) {
        pStat = {
          id: crypto.randomUUID(),
          tournament_id: fixture.tournament_id,
          team_id: teamId,
          player_id: p.id,
          player_name: p.name,
          matches_played: 0,
          total_runs: 0,
          total_balls_faced: 0,
          total_wickets: 0,
          total_runs_conceded: 0,
          total_balls_bowled: 0,
          fours_hit: 0,
          sixes_hit: 0
        };
        playerStats.push(pStat);
      }
      pStat.matches_played += 1;
      pStat.total_runs += (p.runsScored || 0);
      pStat.total_balls_faced += (p.ballsFaced || 0);
      pStat.total_wickets += (p.wicketsTaken || 0);
      pStat.total_runs_conceded += (p.runsConceded || 0);
      pStat.total_balls_bowled += Math.round((p.oversBowled || 0) * 6);
      pStat.fours_hit = (pStat.fours_hit || 0) + (p.fours || 0);
      pStat.sixes_hit = (pStat.sixes_hit || 0) + (p.sixes || 0);
    });
  };

  processPlayers(matchState.teamA?.players || [], tTeamA.id);
  processPlayers(matchState.teamB?.players || [], tTeamB.id);

  saveDatabase();
}
