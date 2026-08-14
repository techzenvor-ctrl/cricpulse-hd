export interface Player {
  id: string;
  name: string;
  teamId: 'team_a' | 'team_b';
  runsScored: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  oversBowled: number; // in fractional notation or balls
  ballsBowled: number;
  runsConceded: number;
  wicketsTaken: number;
  isOut: boolean;
  battingStatus?: 'not_batting' | 'active' | 'out' | 'retired_hurt' | 'retired_out';
  dismissalInfo?: string;
  contextualImpactScore?: number; // CIS out of 10
}

export type ExtraType = 'none' | 'wide' | 'no_ball' | 'bye' | 'leg_bye';

export type WicketType = 'none' | 'bowled' | 'caught' | 'lbw' | 'run_out' | 'stumped' | 'hit_wicket' | 'retired_hurt' | 'retired_out';

export interface BallEvent {
  id: string;
  overNum: number; // 0-indexed
  ballNum: number; // 1-indexed for legal balls (1-6)
  strikerId: string;
  strikerName: string;
  nonStrikerId: string;
  bowlerId: string;
  bowlerName: string;
  runsScored: number; // off bat (0, 1, 2, 3, 4, 6)
  extraType: ExtraType;
  extraRuns: number; // runs from extra
  isLegalDelivery: boolean;
  wicketEvent?: {
    type: WicketType;
    dismissedPlayerId: string;
    dismissedPlayerName: string;
    fielderName?: string;
  };
  totalRunsEvent: number; // total runs from this ball (bat + extra)
  wagonWheelX?: number; // percentage 0-100
  wagonWheelY?: number; // percentage 0-100
}

export interface Partnership {
  runs: number;
  balls: number;
  batsmenIds: [string, string];
}

export interface MatchState {
  id: string;
  tournamentId?: string;
  fixtureId?: string;
  teamA: {
    id: 'team_a';
    name: string;
    players: Player[];
    flagUrl: string;
  };
  teamB: {
    id: 'team_b';
    name: string;
    players: Player[];
    flagUrl: string;
  };
  tossWinner: 'team_a' | 'team_b';
  tossDecidedTo: 'bat' | 'bowl';
  matchStatus: 'scheduled' | 'live' | 'innings_break' | 'completed' | 'abandoned';
  currentInnings: 1 | 2;
  battingTeamId: 'team_a' | 'team_b';
  bowlingTeamId: 'team_a' | 'team_b';
  maxOvers: number;
  target?: number; // Init only during 2nd innings
  resultText?: string;
  runs: number;
  wickets: number;
  legalBalls: number; // total legal deliveries bowled so far in current innings
  strikerId: string; // active batter
  nonStrikerId: string; // secondary batter
  activeBowlerId: string; // active bowler
  currentPartnership: Partnership;
  historicalPartnerships: {
    runs: number;
    balls: number;
    batter1Name: string;
    batter2Name: string;
  }[];
  fallOfWickets: {
    wicketNum: number;
    runs: number;
    oversCount: string;
    batsmanName: string;
  }[];
  ballHistory: BallEvent[]; // All balls in CURRENT innings
  innings1Total?: {
    runs: number;
    wickets: number;
    oversStr: string;
  };
  venue: string;
  commentaryState?: string; // AI commentator advice
  extras?: { total: number; wides?: number; noBalls?: number; byes?: number; legByes?: number };
  
  // Real-time broadcast overlay triggers
  showTargetOverlay?: boolean;
  showBattingCardOverlay?: boolean;
  showBowlingCardOverlay?: boolean;
  showDismissedPlayerOverlay?: boolean;
  lastDismissedPlayer?: {
    name: string;
    runsScored: number;
    ballsFaced: number;
    fours: number;
    sixes: number;
    dismissalInfo: string;
    teamName: string;
  };
  activeFullScreenPlate?: 'none' | 'vs-splash' | 'playing-xi' | 'batting-card' | 'bowling-card' | 'match-summary' | 'winner' | 'custom-text';
  customTextPlate?: string;
  activeLayout?: string;
  activeAccent?: string;
  activeFont?: string;
  activeBranding?: string;
  activeTournamentName?: string;
  // Phase 2 features extensions
  dlsTarget?: number;
  isSuperOver?: boolean;
  sponsorLogoUrl?: string;
  penaltyRuns?: number;
  showManhattanOverlay?: boolean;
  showPlayingXISplash?: boolean;
  showDrinksSummarySplash?: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  format: 'LEAGUE' | 'GROUP_KNOCKOUT' | 'ROUND_ROBIN' | 'League';
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'ONGOING';
  config_num_groups: number;
  config_matches_per_team: number;
  created_at: string;
}

export interface TournamentTeam {
  id: string;
  tournament_id: string;
  name: string;
  logo_url?: string;
  group_name?: string;
  manual_point_deductions: number;
}

export interface Fixture {
  id: string;
  tournament_id: string;
  team_a_id: string;
  team_b_id: string;
  team_a_name?: string;
  team_b_name?: string;
  match_date: string;
  match_time: string;
  venue: string;
  stage: 'GROUP' | 'SEMI_FINAL' | 'FINAL';
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'ABANDONED';
  winner_team_id: string | null;
  is_tied: boolean;
  is_no_result: boolean;
  team_a_runs: number;
  team_a_wickets: number;
  team_a_overs_faced: number; // e.g. 19.4
  team_b_runs: number;
  team_b_wickets: number;
  team_b_overs_faced: number;
  team_a_overs_allotted: number;
  team_b_overs_allotted: number;
}

export interface PlayerTournamentStats {
  id: string;
  tournament_id: string;
  team_id: string;
  player_id?: string;
  player_name: string;
  total_runs: number;
  total_balls_faced: number;
  total_wickets: number;
  total_runs_conceded: number;
  total_balls_bowled: number;
  matches_played: number;
  dismissals?: number;
  fours_hit?: number;
  sixes_hit?: number;
}
