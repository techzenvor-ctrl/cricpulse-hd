export type ExtraType = 'none' | 'wide' | 'no_ball' | 'bye' | 'leg_bye';
export type WicketType = 'none' | 'bowled' | 'caught' | 'lbw' | 'stumped' | 'run_out' | 'retired_hurt' | 'retired_out';

export interface Player {
  id: string;
  name: string;
  teamId: 'team_a' | 'team_b';
  runsScored: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  oversBowled: number;
  ballsBowled: number;
  runsConceded: number;
  wicketsTaken: number;
  isOut: boolean;
  battingStatus?: 'active' | 'not_batting' | 'out' | 'retired_hurt' | 'retired_out';
  dismissalInfo?: string;
  contextualImpactScore?: number;
  photoUrl?: string;
}

export interface Team {
  id: 'team_a' | 'team_b';
  name: string;
  players: Player[];
  flagUrl?: string;
}

export interface Partnership {
  runs: number;
  balls: number;
  batsmenIds: string[];
}

export interface BallEvent {
  id: string;
  overNum: number;
  ballNum: number;
  strikerId: string;
  strikerName: string;
  nonStrikerId: string;
  bowlerId: string;
  bowlerName: string;
  runsScored: number;
  extraType: ExtraType;
  extraRuns: number;
  isLegalDelivery: boolean;
  wicketEvent?: any;
  totalRunsEvent: number;
  wagonWheelX?: number;
  wagonWheelY?: number;
}

export interface TournamentTeam {
  id: string;
  name: string;
  captain: string;
  coach: string;
  flagUrl: string;
  shortName: string;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  nrr: number;
}

export interface Fixture {
  id: string;
  tournament_id: string;
  venue: string;
  team_a_id: string;
  team_b_id: string;
  team_a_name: string;
  team_b_name: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED';
  team_a_runs?: number;
  team_a_wickets?: number;
  team_a_overs_faced?: number;
  team_b_runs?: number;
  team_b_wickets?: number;
  team_b_overs_faced?: number;
  winner_team_id?: string;
  is_tied?: boolean;
  scheduled_at?: string;
}

export interface MatchState {
  id: string;
  teamA: Team;
  teamB: Team;
  tossWinner?: string;
  tossDecidedTo?: string;
  matchStatus: 'live' | 'innings_break' | 'completed' | 'setup';
  currentInnings: number;
  battingTeamId: 'team_a' | 'team_b';
  bowlingTeamId: 'team_a' | 'team_b';
  maxOvers: number;
  runs: number;
  wickets: number;
  legalBalls: number;
  strikerId: string;
  nonStrikerId: string;
  activeBowlerId: string;
  currentPartnership: Partnership;
  historicalPartnerships: Array<{ runs: number; balls: number; batter1Name: string; batter2Name: string }>;
  fallOfWickets: Array<any>;
  ballHistory: BallEvent[];
  venue: string;
  commentaryState: string;
  customTextPlate: string;
  target?: number;
  innings1Total?: { runs: number; wickets: number; oversStr: string };
  resultText?: string;
  showTargetOverlay?: boolean;
  showBattingCardOverlay?: boolean;
  showBowlingCardOverlay?: boolean;
  showDismissedPlayerOverlay?: boolean;
  lastDismissedPlayer?: any;
  activeFullScreenPlate?: string;
  isSuperOver?: boolean;
  penaltyRuns?: number;
  dlsTarget?: number;
  tournamentId?: string;
  fixtureId?: string;
  activeLayout?: string;
  activeAccent?: string;
  activeFont?: string;
  activeBranding?: string;
  activeTournamentName?: string;
  [key: string]: any;
}

export interface Tournament {
  id: string;
  name: string;
  format: string;
  status: string;
  config_num_groups: number;
  config_matches_per_team: number;
  created_at: string;
}
