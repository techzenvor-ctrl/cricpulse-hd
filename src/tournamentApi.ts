import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import type { Fixture, MatchState, TournamentTeam } from './types';

const router = express.Router();
const DB_PATH = path.resolve(process.cwd(), 'tournament_db.json');

interface TournamentDb {
  tournaments: any[];
  tournamentTeams: TournamentTeam[];
  fixtures: Fixture[];
  playerStats: any[];
}

const defaultDb: TournamentDb = {
  tournaments: [
    {
      id: 'default-league-2026',
      name: 'CRICPULSE LEAGUE 2026',
      format: 'League',
      status: 'ONGOING',
      config_num_groups: 1,
      config_matches_per_team: 3,
      created_at: new Date().toISOString(),
    },
  ],
  tournamentTeams: [],
  fixtures: [],
  playerStats: [],
};

function loadDatabase(): TournamentDb {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw) as TournamentDb;
    return {
      tournaments: parsed.tournaments ?? defaultDb.tournaments,
      tournamentTeams: parsed.tournamentTeams ?? [],
      fixtures: parsed.fixtures ?? [],
      playerStats: parsed.playerStats ?? [],
    };
  } catch {
    return defaultDb;
  }
}

const database = loadDatabase();

export const tournamentTeams = database.tournamentTeams;
export const fixtures = database.fixtures;
export const playerStats = database.playerStats;

function seedTeams() {
  if (tournamentTeams.length > 0) return;
  const seeded = [
    { id: 'team-ind', name: 'INDIA', captain: 'Virat Kohli', coach: 'Ravi Shastri', flagUrl: 'https://flagcdn.com/w40/in.png', shortName: 'IND', points: 6, wins: 2, losses: 1, draws: 0, nrr: 0.72 },
    { id: 'team-aus', name: 'AUSTRALIA', captain: 'Pat Cummins', coach: 'Andrew McDonald', flagUrl: 'https://flagcdn.com/w40/au.png', shortName: 'AUS', points: 5, wins: 1, losses: 1, draws: 0, nrr: 0.18 },
    { id: 'team-eng', name: 'ENGLAND', captain: 'Jos Buttler', coach: 'Matthew Mott', flagUrl: 'https://flagcdn.com/w40/gb-eng.png', shortName: 'ENG', points: 4, wins: 1, losses: 2, draws: 0, nrr: -0.41 },
  ];
  tournamentTeams.push(...seeded);
}

function seedFixtures() {
  if (fixtures.length > 0) return;
  fixtures.push(
    {
      id: 'fixture-1',
      tournament_id: 'default-league-2026',
      venue: 'MUMBAI',
      team_a_id: 'team-ind',
      team_b_id: 'team-aus',
      team_a_name: 'INDIA',
      team_b_name: 'AUSTRALIA',
      status: 'LIVE',
      team_a_runs: 188,
      team_a_wickets: 4,
      team_a_overs_faced: 16.4,
      team_b_runs: 0,
      team_b_wickets: 0,
      team_b_overs_faced: 0,
      scheduled_at: new Date().toISOString(),
    },
    {
      id: 'fixture-2',
      tournament_id: 'default-league-2026',
      venue: 'LONDON',
      team_a_id: 'team-eng',
      team_b_id: 'team-ind',
      team_a_name: 'ENGLAND',
      team_b_name: 'INDIA',
      status: 'SCHEDULED',
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    },
  );
}

function seedStats() {
  if (playerStats.length > 0) return;
  playerStats.push(
    { id: 'ps-1', name: 'Virat Kohli', teamId: 'team-ind', runs: 412, wickets: 0, strikeRate: 132.4 },
    { id: 'ps-2', name: 'Pat Cummins', teamId: 'team-aus', runs: 78, wickets: 11, strikeRate: 86.8 },
    { id: 'ps-3', name: 'Ben Stokes', teamId: 'team-eng', runs: 264, wickets: 7, strikeRate: 124.2 },
  );
}

seedTeams();
seedFixtures();
seedStats();

export function saveDatabase() {
  const payload: TournamentDb = {
    tournaments: database.tournaments,
    tournamentTeams,
    fixtures,
    playerStats,
  };
  fs.writeFileSync(DB_PATH, JSON.stringify(payload, null, 2));
}

export function saveDatabaseToSupabase(_client: any) {
  saveDatabase();
}

export let supabaseClient: any = null;
export function setSupabaseClient(client: any) {
  supabaseClient = client;
}

export function handleDeleteTeam(req: express.Request, res: express.Response) {
  const { teamId } = req.params;
  const index = tournamentTeams.findIndex((team) => team.id === teamId);
  if (index >= 0) {
    tournamentTeams.splice(index, 1);
    saveDatabase();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Team not found' });
  }
}

export function handleUpdateTeam(req: express.Request, res: express.Response) {
  const { teamId } = req.params;
  const existing = tournamentTeams.find((team) => team.id === teamId);
  if (!existing) {
    res.status(404).json({ error: 'Team not found' });
    return;
  }

  Object.assign(existing, req.body);
  saveDatabase();
  res.json(existing);
}

export function syncCompletedMatchToTournament(matchState: MatchState) {
  const fixture = fixtures.find((item) => item.id === matchState.fixtureId);
  if (fixture) {
    fixture.status = 'COMPLETED';
    fixture.team_a_runs = matchState.teamA.players.reduce((acc, player) => acc + player.runsScored, 0);
    fixture.team_b_runs = matchState.teamB.players.reduce((acc, player) => acc + player.runsScored, 0);
    fixture.team_a_wickets = matchState.wickets;
    fixture.team_a_overs_faced = Number((matchState.legalBalls / 6).toFixed(1));
    if (matchState.resultText?.includes('WON')) {
      fixture.winner_team_id = matchState.runs > (matchState.innings1Total?.runs || 0) ? matchState.battingTeamId === 'team_a' ? 'team-a' : 'team-b' : 'team-a';
    }
  }
  saveDatabase();
}

router.get('/teams', (_req, res) => {
  res.json(tournamentTeams);
});

router.post('/teams', (req, res) => {
  const team = {
    id: `team-${Date.now()}`,
    name: req.body.name?.toUpperCase() || 'NEW TEAM',
    captain: req.body.captain || 'Captain',
    coach: req.body.coach || 'Coach',
    flagUrl: req.body.flagUrl || 'https://flagcdn.com/w40/gb.png',
    shortName: (req.body.shortName || 'NEW').toUpperCase(),
    points: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    nrr: 0,
  } as TournamentTeam;
  tournamentTeams.push(team);
  saveDatabase();
  res.json(team);
});

router.put('/teams/:teamId', (req, res) => {
  const existing = tournamentTeams.find((team) => team.id === req.params.teamId);
  if (!existing) {
    res.status(404).json({ error: 'Team not found' });
    return;
  }
  Object.assign(existing, req.body);
  saveDatabase();
  res.json(existing);
});

router.delete('/teams/:teamId', (req, res) => {
  const index = tournamentTeams.findIndex((team) => team.id === req.params.teamId);
  if (index >= 0) {
    tournamentTeams.splice(index, 1);
    saveDatabase();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Team not found' });
  }
});

router.get('/fixtures', (_req, res) => {
  res.json(fixtures);
});

router.post('/fixtures', (req, res) => {
  const fixture = {
    id: `fixture-${Date.now()}`,
    tournament_id: req.body.tournament_id || 'default-league-2026',
    venue: req.body.venue || 'TBD',
    team_a_id: req.body.team_a_id || 'team-ind',
    team_b_id: req.body.team_b_id || 'team-aus',
    team_a_name: req.body.team_a_name || 'INDIA',
    team_b_name: req.body.team_b_name || 'AUSTRALIA',
    status: 'SCHEDULED',
    scheduled_at: new Date().toISOString(),
  } as Fixture;
  fixtures.push(fixture);
  saveDatabase();
  res.json(fixture);
});

router.put('/fixtures/:fixtureId', (req, res) => {
  const existing = fixtures.find((fixture) => fixture.id === req.params.fixtureId);
  if (!existing) {
    res.status(404).json({ error: 'Fixture not found' });
    return;
  }
  Object.assign(existing, req.body);
  saveDatabase();
  res.json(existing);
});

router.delete('/fixtures/:fixtureId', (req, res) => {
  const index = fixtures.findIndex((fixture) => fixture.id === req.params.fixtureId);
  if (index >= 0) {
    fixtures.splice(index, 1);
    saveDatabase();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Fixture not found' });
  }
});

router.get('/player-stats', (_req, res) => {
  res.json(playerStats);
});

export { router as tournamentRouter };
