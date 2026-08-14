import React, { useEffect, useMemo, useState, useRef } from 'react';
import type { Fixture, MatchState, Player, TournamentTeam, Tournament } from './types';

const defaultView = 'fan';

type View = 'fan' | 'admin' | 'tournament' | 'obs' | 'setup' | 'settings' | 'history';
type Toast = { id: number; message: string; variant: 'accent' | 'teal' | 'danger' };

type WicketDraft = {
  open: boolean;
  type: string;
  dismissedPlayerId: string;
  fielderName: string;
  nextBatsmanId?: string;
  newBatsmanName?: string;
};

function App() {
  const [view, setView] = useState<View>(defaultView);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [viewHistory, setViewHistory] = useState<View[]>([]);
  const [match, setMatch] = useState<MatchState | null>(null);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [historyMatches, setHistoryMatches] = useState<MatchState[]>([]);
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<'live' | 'offline'>('live');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Tournament Module States
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('default-league-2026');
  const [tournamentTeams, setTournamentTeams] = useState<TournamentTeam[]>([]);
  const [tournamentFixtures, setTournamentFixtures] = useState<Fixture[]>([]);
  const [tournamentStandings, setTournamentStandings] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<{ mostRuns: any[]; mostWickets: any[]; mostSixes: any[]; mostFours: any[]; bestSR: any[] }>({ mostRuns: [], mostWickets: [], mostSixes: [], mostFours: [], bestSR: [] });
  const [tournamentTab, setTournamentTab] = useState<'dashboard' | 'fixtures' | 'standings' | 'bracket' | 'stats' | 'admin'>('dashboard');

  // Admin & Editing Forms
  const [newTournamentForm, setNewTournamentForm] = useState({ name: '', format: 'League', config_num_groups: 1, config_matches_per_team: 3 });
  const [newTeamForm, setNewTeamForm] = useState({ name: '', logo_url: '', group_name: 'LEAGUE' });
  const [editTeamId, setEditTeamId] = useState<string | null>(null);
  const [editTeamForm, setEditTeamForm] = useState({ name: '', logo_url: '', group_name: 'LEAGUE' });
  const [selectedFixtureToStart, setSelectedFixtureToStart] = useState<string>('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [customStartForm, setCustomStartForm] = useState({ teamA: '', teamB: '', venue: 'Local Ground', overs: 20 });

  const [adminForm, setAdminForm] = useState({ runs: '0', extra: 'none', wicket: 'none' });
  const [selectedExtraForRuns, setSelectedExtraForRuns] = useState<string | null>(null);
  const [bowlerName, setBowlerName] = useState('');
  const [batterName, setBatterName] = useState('');
  const [batterRole, setBatterRole] = useState<'striker' | 'non_striker'>('striker');
  const [wicketDraft, setWicketDraft] = useState<WicketDraft>({ open: false, type: 'bowled', dismissedPlayerId: '', fielderName: '', nextBatsmanId: '', newBatsmanName: '' });
  const [setupStep, setSetupStep] = useState(0);
  const [setupSubStep, setSetupSubStep] = useState<'squad' | 'substitutes'>('squad');
  const [setupErrors, setSetupErrors] = useState<Record<string, string>>({});
  const [setupForm, setSetupForm] = useState({
    teamAName: '',
    teamBName: '',
    teamALogo: '',
    teamBLogo: '',
    teamAPlayers: Array.from({ length: 11 }, () => ''),
    teamBPlayers: Array.from({ length: 11 }, () => ''),
    substitutesA: Array.from({ length: 4 }, () => ''),
    substitutesB: Array.from({ length: 4 }, () => ''),
    tossWinner: 'team_a',
    tossDecision: 'bat',
    innings: 1,
    maxOvers: 20,
    venue: '',
  });
  const [settingsForm, setSettingsForm] = useState({
    inningsOversCap: 20,
    tossWinner: 'team_a',
    tossDecision: 'bat',
    activeInnings: 1,
  });
  const [obsConfig, setObsConfig] = useState({
    title: 'LIVE NOW',
    subtitle: 'CricPulse Scorecast Engine',
    layout: 'lower-third',
    plateMode: 'overlay',
    transparent: false,
    accentColor: '#c3f400',
    opacity: 87,
    horizontalOffset: 0,
    verticalOffset: 0,
    branding: 'CricPulse',
    safeArea: true,
    sourceStyle: 'Live Broadcast',
    fontFamily: 'Space Grotesk',
    customText: 'MATCH LIVE NOW',
    logoUrl: '',
    tournamentName: 'ICC Champions Trophy',
    topBarInfoMode: 'auto',
  });

  const [topBarCycleIndex, setTopBarCycleIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTopBarCycleIndex((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const [customNoticeDraft, setCustomNoticeDraft] = useState('');

  useEffect(() => {
    setCustomNoticeDraft(obsConfig.customText || '');
  }, [obsConfig.customText]);

  const handleUpdateObsConfig = async (key: string, value: any) => {
    const updated = { ...obsConfig, [key]: value };
    setObsConfig(updated);

    try {
      await fetch('/api/match-state/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeLayout: updated.layout,
          activeAccent: updated.accentColor,
          activeFont: updated.fontFamily,
          activeFullScreenPlate: updated.plateMode,
          activeBranding: updated.branding,
          activeTournamentName: updated.tournamentName,
          customTextPlate: updated.customText,
          sponsorLogoUrl: updated.logoUrl,
        })
      });
    } catch (err) {
      console.error('Failed to sync OBS settings:', err);
    }
  };

  const [lastRuns, setLastRuns] = useState(0);
  const [lastWickets, setLastWickets] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [lastBallCount, setLastBallCount] = useState(-1);
  const [activeMilestone, setActiveMilestone] = useState<'none' | 'four' | 'six' | 'wicket' | 'victory'>('none');
  const milestoneTimeoutRef = useRef<any>(null);
  const [streamIdentity, setStreamIdentity] = useState('Studio One');
  const [facingMode, setFacingMode] = useState('user');
  const [resolution, setResolution] = useState('720p');
  const [micLevel, setMicLevel] = useState(68);
  const [showGrid, setShowGrid] = useState(true);
  const [fixtureDraft, setFixtureDraft] = useState({ venue: 'Mumbai', teamAName: 'INDIA', teamBName: 'AUSTRALIA', status: 'SCHEDULED' });
  const [fixtureResultDraft, setFixtureResultDraft] = useState({ fixtureId: '', winner: 'none', tied: false, noResult: false });
  const [targetEnabled, setTargetEnabled] = useState(true);
  const [openingStriker, setOpeningStriker] = useState('');
  const [openingNonStriker, setOpeningNonStriker] = useState('');
  const [openingBowler, setOpeningBowler] = useState('');

  useEffect(() => {
    if (setupStep === 2) {
      const deciderChoice = setupForm.tossDecision || 'bat';
      const isAWinner = setupForm.tossWinner === 'team_a';
      const battingTeamLabel = deciderChoice === 'bat' ? (isAWinner ? 'A' : 'B') : (isAWinner ? 'B' : 'A');
      const battingTeamPlayers = (battingTeamLabel === 'A' ? setupForm.teamAPlayers : setupForm.teamBPlayers).filter(Boolean);
      const bowlingTeamPlayers = (battingTeamLabel === 'A' ? setupForm.teamBPlayers : setupForm.teamAPlayers).filter(Boolean);

      if (battingTeamPlayers.length > 0 && !openingStriker) {
        setOpeningStriker(battingTeamPlayers[0]);
      }
      if (battingTeamPlayers.length > 1 && !openingNonStriker) {
        setOpeningNonStriker(battingTeamPlayers[1]);
      }
      if (bowlingTeamPlayers.length > 0 && !openingBowler) {
        setOpeningBowler(bowlingTeamPlayers[0]);
      }
    }
  }, [setupStep, setupForm.teamAPlayers, setupForm.teamBPlayers, setupForm.tossWinner, setupForm.tossDecision, openingStriker, openingNonStriker, openingBowler]);

  const fetchTournamentDetails = async (tId: string) => {
    try {
      const [standingsRes, statsRes, fixturesRes, singleTournamentRes] = await Promise.all([
        fetch(`/api/tournament/${tId}/standings`),
        fetch(`/api/tournament/${tId}/stats`),
        fetch(`/api/tournament/${tId}/fixtures`),
        fetch(`/api/tournament/${tId}`)
      ]);

      const stData = await standingsRes.json();
      const statsObj = await statsRes.json();
      const fixData = await fixturesRes.json();
      const singleTourObj = await singleTournamentRes.json();

      setTournamentStandings(stData);
      setStatsData(statsObj);
      setTournamentFixtures(fixData);
      if (singleTourObj && Array.isArray(singleTourObj.teams)) {
        setTournamentTeams(singleTourObj.teams);
      }
    } catch (err) {
      console.error('Failed to fetch tournament details:', err);
    }
  };

  const refreshData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [matchRes, teamsRes, fixturesRes, statsRes, historyRes, tournamentsRes] = await Promise.all([
        fetch('/api/match-state'),
        fetch('/api/tournament/teams'),
        fetch('/api/tournament/fixtures'),
        fetch('/api/tournament/player-stats'),
        fetch('/api/match-history'),
        fetch('/api/tournament'),
      ]);
      const [matchData, teamsData, fixturesData, statsData, historyData, tournamentsData] = await Promise.all([
        matchRes.json(),
        teamsRes.json(),
        fixturesRes.json(),
        statsRes.json(),
        historyRes.json(),
        tournamentsRes.json(),
      ]);
      setMatch(matchData);
      setTeams(teamsData);
      setFixtures(fixturesData);
      setStats(statsData);
      setHistoryMatches(historyData);
      setTournaments(tournamentsData);
      if (tournamentsData.length > 0 && !tournamentsData.find((t: any) => t.id === selectedTournamentId)) {
        setSelectedTournamentId(tournamentsData[0].id);
      }
      setConnection('live');
    } catch {
      setConnection('offline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTournamentId) {
      fetchTournamentDetails(selectedTournamentId);
    }
  }, [selectedTournamentId]);

  useEffect(() => {
    refreshData(true);

    const eventSource = new EventSource('/api/match-state/stream');
    eventSource.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === 'INITIAL_STATE' || payload.type === 'SCORE_UPDATE') {
        setMatch(payload.data);
        setConnection('live');
      }
    };
    eventSource.onerror = () => {
      setConnection('offline');
    };

    const interval = window.setInterval(() => {
      fetch('/api/match-state').then((res) => res.json()).then((data) => setMatch(data)).catch(() => setConnection('offline'));
    }, 4000);

    return () => {
      eventSource.close();
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isolatedParam = params.get('isolated');
    const layoutParam = params.get('layout');
    const plateModeParam = params.get('plateMode');
    const accentColorParam = params.get('accentColor');
    const fontFamilyParam = params.get('fontFamily');
    const customTextParam = params.get('customText');
    const tournamentNameParam = params.get('tournamentName');

    if (isolatedParam === 'true') {
      setView('obs');
    }
    if (layoutParam || plateModeParam || accentColorParam || fontFamilyParam || customTextParam || tournamentNameParam) {
      setObsConfig(current => ({
        ...current,
        ...(layoutParam ? { layout: layoutParam } : {}),
        ...(plateModeParam ? { plateMode: plateModeParam } : {}),
        ...(accentColorParam && accentColorParam !== 'null' && accentColorParam !== 'undefined' ? { accentColor: '#' + accentColorParam.replace('#', '') } : {}),
        ...(fontFamilyParam ? { fontFamily: fontFamilyParam } : {}),
        ...(customTextParam ? { customText: customTextParam } : {}),
        ...(tournamentNameParam ? { tournamentName: tournamentNameParam } : {}),
      }));
    }
  }, []);

  useEffect(() => {
    if (!match) return;

    if (isInitialLoad) {
      setLastRuns(match.runs);
      setLastWickets(match.wickets);
      setLastBallCount(match.ballHistory?.length || 0);
      setIsInitialLoad(false);
      return;
    }

    const currentBallCount = match.ballHistory?.length || 0;

    const triggerMilestone = (milestone: 'four' | 'six' | 'wicket' | 'victory', delay: number) => {
      if (milestoneTimeoutRef.current) {
        clearTimeout(milestoneTimeoutRef.current);
      }
      setActiveMilestone(milestone);
      milestoneTimeoutRef.current = setTimeout(() => {
        setActiveMilestone('none');
      }, delay);
    };

    if (lastBallCount !== -1 && currentBallCount > lastBallCount) {
      const latestBall = match.ballHistory[currentBallCount - 1];
      if (latestBall) {
        if (latestBall.wicketEvent) {
          triggerMilestone('wicket', 4500);
        } else if (latestBall.runsScored === 6 && (!latestBall.extraType || latestBall.extraType === 'none')) {
          triggerMilestone('six', 3500);
        } else if (latestBall.runsScored === 4 && (!latestBall.extraType || latestBall.extraType === 'none')) {
          triggerMilestone('four', 3500);
        }
      }
    }

    if (match.matchStatus.toLowerCase().includes('won') || match.matchStatus.toLowerCase().includes('victory') || match.matchStatus.toLowerCase().includes('winner')) {
      if (match.runs > 0 && activeMilestone === 'none') {
        triggerMilestone('victory', 4500);
      }
    }

    if (match) {
      setObsConfig(current => ({
        ...current,
        layout: match.activeLayout || current.layout,
        accentColor: match.activeAccent || current.accentColor,
        fontFamily: match.activeFont || current.fontFamily,
        plateMode: match.activeFullScreenPlate || current.plateMode,
        branding: match.activeBranding || current.branding,
        tournamentName: match.activeTournamentName || current.tournamentName,
        customText: match.customTextPlate || current.customText,
        logoUrl: match.sponsorLogoUrl || current.logoUrl,
      }));
    }

    setLastRuns(match.runs);
    setLastWickets(match.wickets);
    setLastBallCount(currentBallCount);
  }, [match, lastRuns, lastWickets, isInitialLoad, lastBallCount]);

  useEffect(() => {
    if (!match) return;
    setSetupForm((current) => (
      current.teamAName || current.teamBName ? current : {
        ...current,
        teamAName: match.teamA.name,
        teamBName: match.teamB.name,
        teamALogo: match.teamA.flagUrl || '',
        teamBLogo: match.teamB.flagUrl || '',
        teamAPlayers: Array.from({ length: 11 }, (_, i) => match.teamA.players[i]?.name || ''),
        teamBPlayers: Array.from({ length: 11 }, (_, i) => match.teamB.players[i]?.name || ''),
        substitutesA: Array.from({ length: 4 }, (_, i) => match.teamA.players[11 + i]?.name || ''),
        substitutesB: Array.from({ length: 4 }, (_, i) => match.teamB.players[11 + i]?.name || ''),
      }
    ));
    setSettingsForm((current) => ({
      ...current,
      inningsOversCap: match.maxOvers || current.inningsOversCap,
      tossWinner: match.tossWinner || current.tossWinner,
      tossDecision: match.tossDecidedTo || current.tossDecision,
      activeInnings: match.currentInnings || current.activeInnings,
    }));
  }, [match]);

  useEffect(() => {
    if (!toasts.length) return;
    const timer = window.setTimeout(() => setToasts((curr) => curr.slice(1)), 2900);
    return () => window.clearTimeout(timer);
  }, [toasts]);

  const pushToast = (message: string, variant: Toast['variant'] = 'accent') => {
    const id = Date.now();
    setToasts((curr) => [...curr, { id, message, variant }]);
  };

  const switchView = (nextView: View, back = false) => {
    if (!back) {
      setViewHistory((current) => [...current, view]);
    } else {
      setViewHistory((current) => current.slice(0, -1));
    }
    setView(nextView);
  };

  const battingTeam = useMemo(() => match?.battingTeamId === 'team_a' ? match?.teamA : match?.teamB, [match]);
  const bowlingTeam = useMemo(() => match?.bowlingTeamId === 'team_a' ? match?.teamA : match?.teamB, [match]);
  const striker = useMemo(() => battingTeam?.players.find((player) => player.id === match?.strikerId), [battingTeam, match]);
  const nonStriker = useMemo(() => battingTeam?.players.find((player) => player.id === match?.nonStrikerId), [battingTeam, match]);
  const bowler = useMemo(() => bowlingTeam?.players.find((player) => player.id === match?.activeBowlerId), [bowlingTeam, match]);
  const overDisplay = match ? `${Math.floor(match.legalBalls / 6)}.${match.legalBalls % 6}` : '0.0';

  const standings = useMemo(() => {
    const table = teams.map((team) => ({ ...team, played: 0, won: 0, lost: 0, tied: 0, noResult: 0, points: team.points || 0 }));
    fixtures.forEach((fixture) => {
      const home = table.find((entry) => entry.id === fixture.team_a_id || entry.name === fixture.team_a_name);
      const away = table.find((entry) => entry.id === fixture.team_b_id || entry.name === fixture.team_b_name);
      if (!home || !away) return;
      if (fixture.status !== 'COMPLETED' && fixture.status !== 'LIVE') return;
      home.played += 1;
      away.played += 1;
      if (fixture.is_tied) {
        home.tied += 1;
        away.tied += 1;
        home.points += 1;
        away.points += 1;
      } else if (fixture.winner_team_id) {
        const winnerName = fixture.winner_team_id.toLowerCase();
        if (home.id.toLowerCase() === winnerName || home.name.toLowerCase() === winnerName) {
          home.won += 1;
          away.lost += 1;
          home.points += 2;
        } else {
          away.won += 1;
          home.lost += 1;
          away.points += 2;
        }
      }
    });
    return table.sort((a, b) => b.points - a.points || (b.nrr || 0) - (a.nrr || 0));
  }, [teams, fixtures]);

  const targetEquation = useMemo(() => {
    if (!match) return '—';
    const oversRemaining = Math.max(0, match.maxOvers * 6 - match.legalBalls);
    const requiredRunRate = Math.max(0, (Number(match.target || 0) - match.runs) / Math.max(oversRemaining / 6, 0.1));
    return `${requiredRunRate.toFixed(1)} RRR • ${((match.runs / Math.max(match.legalBalls / 6, 0.1)) || 0).toFixed(1)} CRR`;
  }, [match]);

  const winProbability = useMemo(() => {
    if (!match) return { home: 50, away: 50 };
    const base = 50 + (match.runs > 80 ? 10 : 0) - (match.wickets > 4 ? 8 : 0);
    return { home: Math.max(36, Math.min(82, base)), away: Math.max(18, Math.min(64, 100 - base)) };
  }, [match]);

  const overlayLink = useMemo(() => {
    const base = `https://broadcast.cricpulse.local/overlay?title=${encodeURIComponent(obsConfig.title)}&subtitle=${encodeURIComponent(obsConfig.subtitle)}&layout=${obsConfig.layout}&accent=${encodeURIComponent(obsConfig.accentColor)}`;
    return `${base}&opacity=${obsConfig.opacity}`;
  }, [obsConfig]);

  const createBallPayload = (runsScored: number, extraType: string, extraRuns: number, wicketType: string) => ({
    runsScored,
    extraType,
    extraRuns,
    wicketEvent: wicketType === 'none' ? { type: 'none' } : { type: wicketType, dismissedPlayerId: wicketDraft.dismissedPlayerId || undefined, fielderName: wicketDraft.fielderName || undefined },
  });

  const submitBall = async (runsScored: number, extraType: string, extraRuns: number, wicketType: string) => {
    if (!match) return;

    // Enforce consecutive overs check client-side
    if (match.legalBalls > 0 && match.legalBalls % 6 === 0) {
      const lastLegalBall = [...match.ballHistory].reverse().find(b => b.isLegalDelivery);
      if (lastLegalBall && lastLegalBall.bowlerId === match.activeBowlerId) {
        pushToast('A bowler cannot bowl consecutive overs. Please select a different bowler.', 'danger');
        return;
      }
    }

    const previousBallCount = match.ballHistory.length;
    const response = await fetch('/api/match-state/ball', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createBallPayload(runsScored, extraType, extraRuns, wicketType)),
    });
    const next = await response.json();
    if (response.status >= 400) {
      pushToast(next.error || 'Failed to submit ball', 'danger');
      return;
    }
    setMatch(next);
    setConnection('live');
    const latestBall = next.ballHistory[next.ballHistory.length - 1];
    if (latestBall) {
      if (latestBall.wicketEvent) {
        pushToast('WICKET • Out confirmed', 'danger');
      } else if (latestBall.runsScored === 4) {
        pushToast('FOUR • Boundary', 'teal');
      } else if (latestBall.sixes === 6 || latestBall.runsScored === 6) {
        pushToast('SIX • Massive hit', 'accent');
      } else if (latestBall.isLegalDelivery && previousBallCount !== next.ballHistory.length && next.legalBalls % 6 === 0) {
        pushToast('OVER • New over underway', 'accent');
      } else {
        pushToast(`${latestBall.totalRunsEvent} run${latestBall.totalRunsEvent === 1 ? '' : 's'} added`, 'accent');
      }
    }
  };

  const addBall = async () => {
    const runsScored = Number(adminForm.runs) || 0;
    if (adminForm.wicket !== 'none') {
      setWicketDraft({ open: true, type: adminForm.wicket, dismissedPlayerId: striker?.id || '', fielderName: '', nextBatsmanId: '', newBatsmanName: '' });
      return;
    }
    const defaultExtraRuns = adminForm.extra === 'wide' || adminForm.extra === 'no_ball' ? 1 : 0;
    await submitBall(runsScored, adminForm.extra, defaultExtraRuns, 'none');
  };

  const confirmWicket = async () => {
    const runsScored = Number(adminForm.runs) || 0;
    const defaultExtraRuns = adminForm.extra === 'wide' || adminForm.extra === 'no_ball' ? 1 : 0;
    await submitBall(runsScored, adminForm.extra, defaultExtraRuns, wicketDraft.type);
    
    const isStrikerDismissed = wicketDraft.dismissedPlayerId === match?.strikerId;

    if (wicketDraft.newBatsmanName && wicketDraft.newBatsmanName.trim()) {
      await fetch('/api/match-state/add-batter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: wicketDraft.newBatsmanName.trim(),
          role: isStrikerDismissed ? 'striker' : 'non_striker'
        })
      });
    } else if (wicketDraft.nextBatsmanId) {
      await fetch('/api/match-state/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [isStrikerDismissed ? 'strikerId' : 'nonStrikerId']: wicketDraft.nextBatsmanId
        })
      });
    }

    setWicketDraft((current) => ({ ...current, open: false, nextBatsmanId: '', newBatsmanName: '' }));
    refreshData();
  };

  const addBowler = async () => {
    if (!bowlerName.trim()) return;
    const response = await fetch('/api/match-state/add-bowler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: bowlerName.trim() }),
    });
    const next = await response.json();
    setMatch(next);
    setBowlerName('');
    pushToast('Bowler added to the live attack', 'accent');
  };

  const addBatter = async () => {
    if (!batterName.trim()) return;
    const response = await fetch('/api/match-state/add-batter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: batterName.trim(), role: batterRole === 'non_striker' ? 'non_striker' : 'striker' }),
    });
    const next = await response.json();
    setMatch(next);
    setBatterName('');
    pushToast('Batsman updated', 'accent');
  };

  const resetMatch = async () => {
    const response = await fetch('/api/match-state/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamAName: 'INDIA', teamBName: 'AUSTRALIA', maxOvers: 20 }),
    });
    const next = await response.json();
    setMatch(next);
    setConnection('live');
    pushToast('Match reset to the default live setup', 'teal');
  };

  const startSuperOver = async () => {
    const response = await fetch('/api/match-state/super-over', { method: 'POST' });
    const next = await response.json();
    setMatch(next);
    pushToast('Super Over initiated!', 'teal');
  };

  const applyPenalty = async () => {
    const response = await fetch('/api/match-state/penalty', { method: 'POST' });
    const next = await response.json();
    setMatch(next);
    pushToast('5 Penalty runs awarded to batting team', 'accent');
  };

  const archiveMatch = async () => {
    const response = await fetch('/api/match-state/archive', { method: 'POST' });
    const next = await response.json();
    if (next.success) {
      pushToast(`Match successfully archived! Total archived: ${next.count}`, 'teal');
      refreshData();
    } else {
      pushToast('Failed to archive match', 'danger');
    }
  };

  const handleLaunchFixture = async (fixtureId: string) => {
    const fix = tournamentFixtures.find(f => f.id === fixtureId);
    if (!fix) return pushToast('Fixture not found', 'danger');

    // Auto-assemble 11 squad names for setup
    const mockSquad = Array.from({ length: 11 }, (_, i) => `Player ${i + 1}`);
    try {
      const response = await fetch('/api/match-state/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamAName: fix.team_a_name,
          teamBName: fix.team_b_name,
          maxOvers: 20,
          tossWinner: 'team_a',
          tossDecidedTo: 'bat',
          inningsType: '1',
          teamAPlayers: mockSquad.map(n => `${fix.team_a_name} ${n}`),
          teamBPlayers: mockSquad.map(n => `${fix.team_b_name} ${n}`),
          venue: fix.venue || 'International Arena',
          fixtureId: fix.id,
          tournamentId: selectedTournamentId
        }),
      });
      const next = await response.json();
      setMatch(next);
      setView('admin');
      pushToast(`Live scoring launched for ${fix.team_a_name} vs ${fix.team_b_name}!`, 'teal');
    } catch {
      pushToast('Failed to launch match scoring', 'danger');
    }
  };

  const handleLaunchCustomMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStartForm.teamA || !customStartForm.teamB) {
      return pushToast('Both team names are required', 'danger');
    }
    const mockSquad = Array.from({ length: 11 }, (_, i) => `Player ${i + 1}`);
    try {
      const response = await fetch('/api/match-state/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamAName: customStartForm.teamA,
          teamBName: customStartForm.teamB,
          maxOvers: customStartForm.overs,
          tossWinner: 'team_a',
          tossDecidedTo: 'bat',
          inningsType: '1',
          teamAPlayers: mockSquad.map(n => `${customStartForm.teamA} ${n}`),
          teamBPlayers: mockSquad.map(n => `${customStartForm.teamB} ${n}`),
          venue: customStartForm.venue,
        }),
      });
      const next = await response.json();
      setMatch(next);
      setView('admin');
      pushToast(`Custom live match launched: ${customStartForm.teamA} vs ${customStartForm.teamB}!`, 'teal');
    } catch {
      pushToast('Failed to launch custom match', 'danger');
    }
  };

  const requestAi = async () => {
    const response = await fetch('/api/ai-insights', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    const next = await response.json();
    pushToast(next.commentary || 'AI insight ready', 'teal');
  };

  const saveObs = async () => {
    const response = await fetch('/api/match-state/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customTextPlate: `${obsConfig.title} | ${obsConfig.subtitle}` }),
    });
    const next = await response.json();
    setMatch(next);
    pushToast('OBS overlay calibrated', 'accent');
  };

  const applySettings = async () => {
    const response = await fetch('/api/match-state/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        maxOvers: settingsForm.inningsOversCap,
        tossWinner: settingsForm.tossWinner,
        tossDecidedTo: settingsForm.tossDecision,
        currentInnings: settingsForm.activeInnings,
      }),
    });
    const next = await response.json();
    setMatch(next);
    pushToast('Settings applied', 'accent');
  };

  const applySetup = async () => {
    try {
      const combinedPlayersA = [...setupForm.teamAPlayers, ...setupForm.substitutesA].filter(Boolean);
      const combinedPlayersB = [...setupForm.teamBPlayers, ...setupForm.substitutesB].filter(Boolean);

      const response = await fetch('/api/match-state/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamAName: setupForm.teamAName,
          teamBName: setupForm.teamBName,
          teamALogo: setupForm.teamALogo,
          teamBLogo: setupForm.teamBLogo,
          maxOvers: setupForm.maxOvers,
          tossWinner: setupForm.tossWinner,
          tossDecidedTo: setupForm.tossDecision,
          inningsType: String(setupForm.innings),
          teamAPlayers: combinedPlayersA,
          teamBPlayers: combinedPlayersB,
          strikerName: openingStriker,
          nonStrikerName: openingNonStriker,
          bowlerName: openingBowler,
          venue: setupForm.venue,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const next = await response.json();
      setMatch(next);
      setView('admin');
      pushToast('Match setup launched', 'accent');
    } catch (err) {
      console.error('Failed to initialize match:', err);
      pushToast(`Failed to initialize match: ${err instanceof Error ? err.message : String(err)}`, 'danger');
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTournamentForm.name) return pushToast('Tournament name is required', 'danger');
    try {
      const res = await fetch('/api/tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTournamentForm)
      });
      const data = await res.json();
      setTournaments(prev => [...prev, data]);
      setSelectedTournamentId(data.id);
      setNewTournamentForm({ name: '', format: 'League', config_num_groups: 1, config_matches_per_team: 3 });
      pushToast('Tournament created successfully!', 'teal');
    } catch {
      pushToast('Failed to create tournament', 'danger');
    }
  };

  const handleRegisterTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamForm.name) return pushToast('Team name is required', 'danger');
    try {
      const res = await fetch(`/api/tournament/${selectedTournamentId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teams: [newTeamForm] })
      });
      const data = await res.json();
      if (data.success) {
        setTournamentTeams(prev => [...prev, ...data.teams]);
        setNewTeamForm({ name: '', logo_url: '', group_name: 'LEAGUE' });
        pushToast('Team registered successfully!', 'teal');
        fetchTournamentDetails(selectedTournamentId);
      }
    } catch {
      pushToast('Failed to register team', 'danger');
    }
  };

  const handleUpdateTeam = async (teamId: string) => {
    try {
      const res = await fetch(`/api/tournament/team/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editTeamForm, tournament_id: selectedTournamentId })
      });
      const data = await res.json();
      if (data.success) {
        setEditTeamId(null);
        pushToast('Team updated successfully!', 'teal');
        fetchTournamentDetails(selectedTournamentId);
      }
    } catch {
      pushToast('Failed to update team', 'danger');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!window.confirm('Are you sure you want to delete this team? This will delete all its fixtures!')) return;
    try {
      const res = await fetch(`/api/tournament/team/${teamId}?tournament_id=${selectedTournamentId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        pushToast('Team and associated fixtures deleted!', 'teal');
        fetchTournamentDetails(selectedTournamentId);
      }
    } catch {
      pushToast('Failed to delete team', 'danger');
    }
  };

  const handleGenerateFixtures = async () => {
    try {
      const res = await fetch(`/api/tournament/${selectedTournamentId}/fixtures/generate`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        pushToast('Round robin fixtures generated successfully!', 'teal');
        fetchTournamentDetails(selectedTournamentId);
      }
    } catch {
      pushToast('Failed to generate fixtures', 'danger');
    }
  };

  const handleApplyPointsDeduction = async (teamId: string, pts: number) => {
    try {
      const res = await fetch(`/api/tournament/${selectedTournamentId}/admin/override`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: teamId, manual_point_deductions: pts })
      });
      const data = await res.json();
      if (data.success) {
        pushToast('Points deduction applied!', 'teal');
        fetchTournamentDetails(selectedTournamentId);
      }
    } catch {
      pushToast('Failed to apply deduction', 'danger');
    }
  };

  const handleApplyFixtureResult = async (fixtureId: string) => {
    try {
      const outcome = fixtureResultDraft.noResult ? 'NO-RESULT' : fixtureResultDraft.tied ? 'TIE' : 'WIN';
      const res = await fetch(`/api/tournament/fixtures/${fixtureId}/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcome,
          winner_team_id: fixtureResultDraft.winner === 'none' ? undefined : fixtureResultDraft.winner,
          team_a_runs: 0,
          team_a_wickets: 0,
          team_a_overs_faced: 0,
          team_b_runs: 0,
          team_b_wickets: 0,
          team_b_overs_faced: 0
        })
      });
      const data = await res.json();
      if (data.success) {
        pushToast('Match result recorded manually!', 'teal');
        setFixtureResultDraft({ fixtureId: '', winner: 'none', tied: false, noResult: false });
        fetchTournamentDetails(selectedTournamentId);
      }
    } catch {
      pushToast('Failed to record result', 'danger');
    }
  };

  const copyOverlayLink = async () => {
    await navigator.clipboard.writeText(overlayLink);
    pushToast('Broadcast link copied', 'teal');
  };

  const renderSetupWizard = () => {
    const labels = ['Teams & squads', 'Toss & metrics', 'Launch'];

    const validateStepZero = () => {
      const nextErrors: Record<string, string> = {};

      if (!setupForm.teamAName.trim()) {
        nextErrors.teamAName = 'Enter a name for Team A';
      }
      if (!setupForm.teamBName.trim()) {
        nextErrors.teamBName = 'Enter a name for Team B';
      }

      setupForm.teamAPlayers.forEach((name, index) => {
        if (!name.trim()) {
          nextErrors[`teamAPlayers.${index}`] = `Enter a name for Player ${index + 1}`;
        }
      });
      setupForm.teamBPlayers.forEach((name, index) => {
        if (!name.trim()) {
          nextErrors[`teamBPlayers.${index}`] = `Enter a name for Player ${index + 1}`;
        }
      });

      setSetupErrors(nextErrors);
      return Object.keys(nextErrors).length === 0;
    };

    const validateStepOne = () => {
      const nextErrors: Record<string, string> = {};
      if (!setupForm.venue.trim()) {
        nextErrors.venue = 'Ground / Venue name is required';
      }
      setSetupErrors(nextErrors);
      return Object.keys(nextErrors).length === 0;
    };

    const handleAdvance = () => {
      if (setupStep === 0) {
        if (!validateStepZero()) {
          return;
        }
      }

      if (setupStep === 1) {
        if (!validateStepOne()) {
          return;
        }
      }

      if (setupStep === 2) {
        if (!openingStriker || !openingNonStriker || !openingBowler) {
          pushToast('Please select the opening lineups before launching', 'danger');
          return;
        }
        applySetup();
        return;
      }

      setSetupErrors({});
      setSetupStep((current) => Math.min(2, current + 1));
    };

    const handleBack = () => {
      setSetupErrors({});
      setSetupStep((current) => Math.max(0, current - 1));
    };

    const handleLogoUpload = (team: 'A' | 'B', file: File | null) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSetupForm(prev => ({
          ...prev,
          [team === 'A' ? 'teamALogo' : 'teamBLogo']: base64String
        }));
      };
      reader.readAsDataURL(file);
    };

    const updateTeamName = (team: 'A' | 'B', value: string) => {
      setSetupForm((current) => ({ ...current, [team === 'A' ? 'teamAName' : 'teamBName']: value }));
      setSetupErrors((current) => {
        if (!current[team === 'A' ? 'teamAName' : 'teamBName']) {
          return current;
        }
        const next = { ...current };
        delete next[team === 'A' ? 'teamAName' : 'teamBName'];
        return next;
      });
    };

    const updateTeamPlayer = (team: 'A' | 'B', index: number, value: string) => {
      const fieldKey = team === 'A' ? `teamAPlayers.${index}` : `teamBPlayers.${index}`;
      setSetupForm((current) => ({
        ...current,
        ...(team === 'A'
          ? { teamAPlayers: current.teamAPlayers.map((entry, entryIndex) => (entryIndex === index ? value : entry)) }
          : { teamBPlayers: current.teamBPlayers.map((entry, entryIndex) => (entryIndex === index ? value : entry)) }),
      }));
      setSetupErrors((current) => {
        if (!current[fieldKey]) {
          return current;
        }
        const next = { ...current };
        delete next[fieldKey];
        return next;
      });
    };

    const updateSubstitute = (team: 'A' | 'B', index: number, value: string) => {
      setSetupForm((current) => ({
        ...current,
        ...(team === 'A'
          ? { substitutesA: current.substitutesA.map((entry, entryIndex) => (entryIndex === index ? value : entry)) }
          : { substitutesB: current.substitutesB.map((entry, entryIndex) => (entryIndex === index ? value : entry)) }),
      }));
    };

    const renderPlayerRows = (team: 'A' | 'B') => {
      const players = team === 'A' ? setupForm.teamAPlayers : setupForm.teamBPlayers;
      const label = team === 'A' ? 'Team A' : 'Team B';
      return (
        <div className="wizard-player-list">
          {players.map((name, index) => {
            const fieldKey = team === 'A' ? `teamAPlayers.${index}` : `teamBPlayers.${index}`;
            return (
              <div key={`${label.toLowerCase()}-${index}`} className="wizard-player-row">
                <span className="wizard-player-number">{index + 1}</span>
                <div className="wizard-field-stack">
                  <input
                    value={name}
                    onChange={(event) => updateTeamPlayer(team, index, event.target.value)}
                    placeholder={`Player ${index + 1}`}
                  />
                  {setupErrors[fieldKey] ? <span className="wizard-field-error">{setupErrors[fieldKey]}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      );
    };

    const renderSubstitutes = (team: 'A' | 'B') => {
      const substitutes = team === 'A' ? setupForm.substitutesA : setupForm.substitutesB;
      const label = team === 'A' ? 'Team A' : 'Team B';
      return (
        <div className="wizard-player-list">
          {substitutes.map((name, index) => {
            const fieldKey = team === 'A' ? `substitutesA.${index}` : `substitutesB.${index}`;
            return (
              <div key={`${label.toLowerCase()}-sub-${index}`} className="wizard-player-row">
                <span className="wizard-player-number">{index + 1}</span>
                <div className="wizard-field-stack">
                  <input
                    value={name}
                    onChange={(event) => updateSubstitute(team, index, event.target.value)}
                    placeholder={`Substitute ${index + 1}`}
                  />
                  {setupErrors[fieldKey] ? <span className="wizard-field-error">{setupErrors[fieldKey]}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      );
    };

    return (
      <div style={{ display: 'block', width: '100%' }}>
        <section className="card" style={{ width: '100%', padding: '24px 32px' }}>
          <div className="wizard-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p className="section-title">Match setup wizard</p>
              <p className="wizard-helper">Set up your teams, toss details, and launch the match in a guided flow.</p>
            </div>
            <button 
              className="ghost-btn" 
              style={{ border: '1px solid var(--danger)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, borderRadius: '12px', padding: '8px 14px', background: 'transparent' }}
              onClick={async () => {
                if (window.confirm("Are you sure you want to discard the current setup and start a new match from scratch?")) {
                  try {
                    const response = await fetch('/api/match-state/reset', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({}),
                    });
                    const next = await response.json();
                    setMatch(next);
                  } catch (err) {
                    console.error("Failed to reset backend match state:", err);
                  }
                  setSetupForm({
                    teamAName: '',
                    teamBName: '',
                    teamALogo: '',
                    teamBLogo: '',
                    teamAPlayers: Array.from({ length: 11 }, () => ''),
                    teamBPlayers: Array.from({ length: 11 }, () => ''),
                    substitutesA: Array.from({ length: 4 }, () => ''),
                    substitutesB: Array.from({ length: 4 }, () => ''),
                    tossWinner: 'team_a',
                    tossDecision: 'bat',
                    innings: 1,
                    maxOvers: 20,
                    venue: '',
                  });
                  setOpeningStriker('');
                  setOpeningNonStriker('');
                  setOpeningBowler('');
                  setSetupStep(0);
                  setSetupSubStep('squad');
                  setSetupErrors({});
                  pushToast('Setup reset. Start a new match now!', 'danger');
                }
              }}
            >
              🔄 Reset / New Match
            </button>
            <div className="wizard-stepper" role="tablist" aria-label="Setup steps">
              {[0, 1, 2].map((step) => {
                const isComplete = setupStep > step;
                const isCurrent = setupStep === step;
                const isUpcoming = setupStep < step;
                return (
                  <button
                    key={step}
                    className={`wizard-step-pill ${isCurrent ? 'current' : ''} ${isComplete ? 'complete' : ''} ${isUpcoming ? 'upcoming' : ''}`}
                    onClick={() => {
                      if (step <= setupStep) {
                        setSetupStep(step);
                        setSetupSubStep('squad');
                        setSetupErrors({});
                      }
                    }}
                    disabled={step > setupStep}
                  >
                    <span className="wizard-step-badge">{isComplete ? '✓' : isCurrent ? '●' : step + 1}</span>
                    <span>{labels[step]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {setupStep === 0 ? (
            <div className="wizard-step-shell">
              <div className="wizard-step-header">
                <div>
                  <h3 className="wizard-step-title">Step 1 · Teams & squads</h3>
                  <p className="wizard-helper">Enter your playing XI in batting order, then add substitutes if needed.</p>
                </div>
                <div className="wizard-substepper">
                  <button className={`wizard-substep ${setupSubStep === 'squad' ? 'active' : ''}`} onClick={() => setSetupSubStep('squad')}>Playing XI</button>
                  <button className={`wizard-substep ${setupSubStep === 'substitutes' ? 'active' : ''}`} onClick={() => setSetupSubStep('substitutes')}>Substitutes</button>
                </div>
              </div>

              {setupSubStep === 'squad' ? (
                <div className="wizard-team-grid">
                  <div className="wizard-team-card">
                    <div className="wizard-section-heading">
                      <h4>Team A</h4>
                      <span className="wizard-field-badge required">Required</span>
                    </div>
                    <p className="wizard-helper">Enter the team name and the batting order for Team A.</p>
                    <div className="wizard-field-stack">
                      <label>Team A name</label>
                      <input value={setupForm.teamAName} onChange={(event) => updateTeamName('A', event.target.value)} placeholder="Team A" />
                      {setupErrors.teamAName ? <span className="wizard-field-error">{setupErrors.teamAName}</span> : null}
                    </div>
                    <div className="wizard-field-stack" style={{ marginTop: 12, marginBottom: 16 }}>
                      <label>Team A Logo</label>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(event) => handleLogoUpload('A', event.target.files ? event.target.files[0] : null)} 
                          style={{ flex: 1, border: '1.5px dashed var(--border)', padding: '8px', borderRadius: '12px' }}
                        />
                        {setupForm.teamALogo && (
                          <img src={setupForm.teamALogo} alt="A Preview" style={{ height: 40, width: 40, borderRadius: '50%', objectFit: 'cover', background: '#fff', border: '1px solid var(--border)' }} />
                        )}
                      </div>
                    </div>
                    {renderPlayerRows('A')}
                  </div>
                  <div className="wizard-team-card">
                    <div className="wizard-section-heading">
                      <h4>Team B</h4>
                      <span className="wizard-field-badge required">Required</span>
                    </div>
                    <p className="wizard-helper">Enter the team name and the batting order for Team B.</p>
                    <div className="wizard-field-stack">
                      <label>Team B name</label>
                      <input value={setupForm.teamBName} onChange={(event) => updateTeamName('B', event.target.value)} placeholder="Team B" />
                      {setupErrors.teamBName ? <span className="wizard-field-error">{setupErrors.teamBName}</span> : null}
                    </div>
                    <div className="wizard-field-stack" style={{ marginTop: 12, marginBottom: 16 }}>
                      <label>Team B Logo</label>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(event) => handleLogoUpload('B', event.target.files ? event.target.files[0] : null)} 
                          style={{ flex: 1, border: '1.5px dashed var(--border)', padding: '8px', borderRadius: '12px' }}
                        />
                        {setupForm.teamBLogo && (
                          <img src={setupForm.teamBLogo} alt="B Preview" style={{ height: 40, width: 40, borderRadius: '50%', objectFit: 'cover', background: '#fff', border: '1px solid var(--border)' }} />
                        )}
                      </div>
                    </div>
                    {renderPlayerRows('B')}
                  </div>
                </div>
              ) : (
                <div className="wizard-team-grid">
                  <div className="wizard-team-card">
                    <div className="wizard-section-heading">
                      <h4>Team A substitutes</h4>
                      <span className="wizard-field-badge optional" style={{ background: '#edf2f7', color: '#4a5568' }}>Optional</span>
                    </div>
                    <p className="wizard-helper">Add reserve players for Team A if you have them.</p>
                    {renderSubstitutes('A')}
                  </div>
                  <div className="wizard-team-card">
                    <div className="wizard-section-heading">
                      <h4>Team B substitutes</h4>
                      <span className="wizard-field-badge optional" style={{ background: '#edf2f7', color: '#4a5568' }}>Optional</span>
                    </div>
                    <p className="wizard-helper">Add reserve players for Team B if you have them.</p>
                    {renderSubstitutes('B')}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {setupStep === 1 ? (
            <div className="wizard-step-shell">
              <div className="wizard-step-header">
                <div>
                  <h3 className="wizard-step-title">Step 2 · Toss & metrics</h3>
                  <p className="wizard-helper">Choose the toss result, then the match format in order.</p>
                </div>
              </div>
              <div className="wizard-choice-stack">
                <div className="wizard-choice-card active">
                  <div className="wizard-choice-head">
                    <span className="wizard-step-badge">1</span>
                    <div>
                      <h4>Toss winner</h4>
                      <p className="wizard-helper">Who won the toss?</p>
                    </div>
                  </div>
                  <div className="wizard-chip-row">
                    <button className={`wizard-chip ${setupForm.tossWinner === 'team_a' ? 'selected' : ''}`} onClick={() => setSetupForm((current) => ({ ...current, tossWinner: 'team_a' }))}>Team A</button>
                    <button className={`wizard-chip ${setupForm.tossWinner === 'team_b' ? 'selected' : ''}`} onClick={() => setSetupForm((current) => ({ ...current, tossWinner: 'team_b' }))}>Team B</button>
                  </div>
                </div>
                <div className="wizard-choice-card">
                  <div className="wizard-choice-head">
                    <span className="wizard-step-badge">2</span>
                    <div>
                      <h4>Toss decision</h4>
                      <p className="wizard-helper">Choose what they decided to do.</p>
                    </div>
                  </div>
                  <div className="wizard-chip-row">
                    <button className={`wizard-chip ${setupForm.tossDecision === 'bat' ? 'selected' : ''}`} onClick={() => setSetupForm((current) => ({ ...current, tossDecision: 'bat' }))}>Bat first</button>
                    <button className={`wizard-chip ${setupForm.tossDecision === 'bowl' ? 'selected' : ''}`} onClick={() => setSetupForm((current) => ({ ...current, tossDecision: 'bowl' }))}>Bowl first</button>
                  </div>
                </div>
                <div className="wizard-choice-card">
                  <div className="wizard-choice-head">
                    <span className="wizard-step-badge">3</span>
                    <div>
                      <h4>Active innings</h4>
                      <p className="wizard-helper">Pick the innings that is live.</p>
                    </div>
                  </div>
                  <select value={setupForm.innings} onChange={(event) => setSetupForm((current) => ({ ...current, innings: Number(event.target.value) }))}>
                    <option value={1}>1st innings</option>
                    <option value={2}>2nd innings</option>
                  </select>
                </div>
                <div className="wizard-choice-card">
                  <div className="wizard-choice-head">
                    <span className="wizard-step-badge">4</span>
                    <div>
                      <h4>Overs</h4>
                      <p className="wizard-helper">Set the match length.</p>
                    </div>
                  </div>
                  <select value={setupForm.maxOvers} onChange={(event) => setSetupForm((current) => ({ ...current, maxOvers: Number(event.target.value) }))}>
                    <option value={5}>5 overs</option>
                    <option value={10}>10 overs</option>
                    <option value={20}>20 overs</option>
                    <option value={50}>50 overs</option>
                  </select>
                </div>
                <div className="wizard-choice-card">
                  <div className="wizard-choice-head">
                    <span className="wizard-step-badge">5</span>
                    <div>
                      <h4>Ground / Venue Name</h4>
                      <p className="wizard-helper">Enter the match stadium/ground name.</p>
                    </div>
                  </div>
                  <input
                    value={setupForm.venue}
                    onChange={(event) => {
                      setSetupForm((current) => ({ ...current, venue: event.target.value }));
                      setSetupErrors((current) => {
                        const next = { ...current };
                        delete next.venue;
                        return next;
                      });
                    }}
                    placeholder="Wankhede Stadium, Mumbai"
                    style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 12px', background: 'white' }}
                  />
                  {setupErrors.venue ? <span className="wizard-field-error">{setupErrors.venue}</span> : null}
                </div>
              </div>
            </div>
          ) : null}

          {setupStep === 2 ? (
            <div className="wizard-step-shell">
              <div className="wizard-step-header">
                <div>
                  <h3 className="wizard-step-title">Step 3 · Launch</h3>
                  <p className="wizard-helper">Review the setup and launch the match when everything looks right.</p>
                </div>
              </div>
              <div className="wizard-summary-card">
                <div className="stat-box">
                  <span className="stat-label">Teams</span>
                  <div className="stat-value">{setupForm.teamAName || 'Team A'} vs {setupForm.teamBName || 'Team B'}</div>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Match format</span>
                  <div className="stat-value">{setupForm.maxOvers} overs</div>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Toss</span>
                  <div className="stat-value">{setupForm.tossWinner === 'team_a' ? setupForm.teamAName || 'Team A' : setupForm.teamBName || 'Team B'} {setupForm.tossDecision === 'bat' ? 'bat first' : 'bowl first'}</div>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Ground / Venue</span>
                  <div className="stat-value">{setupForm.venue || 'Not specified'}</div>
                </div>
              </div>

              {(() => {
                const deciderChoice = setupForm.tossDecision || 'bat';
                const isAWinner = setupForm.tossWinner === 'team_a';
                const battingTeamLabel = deciderChoice === 'bat' ? (isAWinner ? 'A' : 'B') : (isAWinner ? 'B' : 'A');
                const battingTeamPlayers = (battingTeamLabel === 'A' ? setupForm.teamAPlayers : setupForm.teamBPlayers).filter(Boolean);
                const bowlingTeamPlayers = (battingTeamLabel === 'A' ? setupForm.teamBPlayers : setupForm.teamAPlayers).filter(Boolean);

                return (
                  <div style={{ marginTop: 20, padding: 18, border: '1px solid var(--border)', borderRadius: '18px', display: 'grid', gap: 14 }}>
                    <p className="section-title" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontWeight: 700 }}>
                      <span style={{ fontSize: '1.2rem' }}>📋</span> OPENING LINEUPS
                    </p>
                    <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                      <label style={{ display: 'grid', gap: 6, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: 'var(--muted)' }}>
                        Striker Batsman
                        <select
                          value={openingStriker}
                          onChange={(e) => setOpeningStriker(e.target.value)}
                          style={{ background: '#000', color: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 12px', minHeight: 44 }}
                        >
                          <option value="">Select Striker</option>
                          {battingTeamPlayers.map((name) => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      </label>
                      <label style={{ display: 'grid', gap: 6, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: 'var(--muted)' }}>
                        Non-Striker Batsman
                        <select
                          value={openingNonStriker}
                          onChange={(e) => setOpeningNonStriker(e.target.value)}
                          style={{ background: '#000', color: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 12px', minHeight: 44 }}
                        >
                          <option value="">Select Non-Striker</option>
                          {battingTeamPlayers.filter(name => name !== openingStriker).map((name) => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      </label>
                      <label style={{ display: 'grid', gap: 6, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: 'var(--muted)' }}>
                        Opening Bowler
                        <select
                          value={openingBowler}
                          onChange={(e) => setOpeningBowler(e.target.value)}
                          style={{ background: '#000', color: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 12px', minHeight: 44 }}
                        >
                          <option value="">Select Bowler</option>
                          {bowlingTeamPlayers.map((name) => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : null}

          <div className="wizard-footer">
            <button className="ghost-btn" onClick={handleBack} disabled={setupStep === 0}>Back</button>
            <button
              className="action-btn"
              onClick={handleAdvance}
              style={setupStep === 2 ? { background: '#c3f400', color: '#000', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' } : {}}
            >
              {setupStep === 2 ? 'Initialize Live Match' : 'Continue'}
            </button>
          </div>
        </section>
      </div>
    );
  };

  const renderSettingsView = () => {
    const isCompleted = match?.matchStatus === 'completed';

    return (
      <div className="content-grid" style={{ gridTemplateColumns: '1fr' }}>

        {/* Match Rules override */}
        <section className="card">
          <p className="section-title" style={{ color: 'var(--navy)' }}>Match Rules & Overs Cap</p>
          <div className="form-grid">
            <label>Innings Overs Cap
              <input
                type="number"
                value={settingsForm.inningsOversCap}
                onChange={(e) => setSettingsForm((current) => ({ ...current, inningsOversCap: Number(e.target.value) }))}
              />
            </label>
            <label>Toss Winner
              <select value={settingsForm.tossWinner} onChange={(e) => setSettingsForm((current) => ({ ...current, tossWinner: e.target.value }))}>
                <option value="team_a">Team A ({match?.teamA.name})</option>
                <option value="team_b">Team B ({match?.teamB.name})</option>
              </select>
            </label>
            <label>Toss Decision
              <select value={settingsForm.tossDecision} onChange={(e) => setSettingsForm((current) => ({ ...current, tossDecision: e.target.value }))}>
                <option value="bat">Bat first</option>
                <option value="bowl">Bowl first</option>
              </select>
            </label>
            <label>Active Innings
              <select value={settingsForm.activeInnings} onChange={(e) => setSettingsForm((current) => ({ ...current, activeInnings: Number(e.target.value) }))}>
                <option value={1}>1st Innings</option>
                <option value={2}>2nd Innings</option>
              </select>
            </label>
          </div>
          <div className="control-row" style={{ marginTop: 14 }}>
            <button className="action-btn" onClick={applySettings}>Apply overrides</button>
            <button className="ghost-btn" onClick={resetMatch}>Reload default mock scores</button>
          </div>
        </section>

        {/* Archiver panel */}
        <section className="card" style={{ borderLeft: isCompleted ? '6px solid var(--accent)' : '1px solid var(--border)' }}>
          <p className="section-title">Save Match to Persistent History</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 12 }}>
              <div>
                <strong>Current Match Status:</strong>
                <span className="badge highlight" style={{ marginLeft: 8, textTransform: 'uppercase', background: isCompleted ? 'var(--accent)' : 'var(--teal)', color: 'var(--navy)', fontWeight: 800 }}>
                  {match?.matchStatus || 'LIVE'}
                </span>
              </div>
              <span className="muted" style={{ fontSize: '0.85rem' }}>Venue: {match?.venue || 'Mumbai'}</span>
            </div>

            {isCompleted ? (
              <div style={{ background: 'rgba(195,244,0,0.08)', border: '1.5px solid var(--accent)', color: 'var(--navy)', padding: '14px 18px', borderRadius: 14, fontWeight: 700, fontSize: '0.94rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                Match concluded! Click Archive below to persistently save this scorecard into the database before opening a new match.
              </div>
            ) : (
              <p className="muted" style={{ margin: 0, fontSize: '0.88rem' }}>You can archive this match at any time. Archiving saves the full score sheet and player performance metrics persistently on disk.</p>
            )}

            <div className="control-row">
              <button className="action-btn" onClick={archiveMatch} style={{ background: isCompleted ? 'var(--accent)' : 'var(--navy)', color: isCompleted ? 'var(--navy)' : '#fff', fontWeight: 700 }}>
                Archive Current Match Scorecard
              </button>
            </div>
          </div>
        </section>

        {/* Start Another match */}
        <section className="card">
          <p className="section-title" style={{ color: 'var(--teal)' }}>Launch Another Match</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24, marginTop: 14 }}>

            {/* Launch from tournament fixtures */}
            <div style={{ borderRight: '1px solid var(--border)', paddingRight: 24 }}>
              <strong style={{ display: 'block', fontSize: '0.98rem', marginBottom: 6 }}>Option A: Load Tournament Fixture</strong>
              <p className="muted" style={{ fontSize: '0.85rem', marginBottom: 14 }}>Select a scheduled match from the active tournament to begin live scoring.</p>

              <div className="form-grid" style={{ gap: 12 }}>
                <label>Select Scheduled Fixture:
                  <select
                    value={selectedFixtureToStart}
                    onChange={(e) => setSelectedFixtureToStart(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="">-- Select Match --</option>
                    {tournamentFixtures.filter(f => f.status === 'SCHEDULED' || f.status === 'LIVE').map(f => (
                      <option key={f.id} value={f.id}>{f.team_a_name} vs {f.team_b_name} ({f.stage})</option>
                    ))}
                  </select>
                </label>
                <button
                  className="action-btn"
                  disabled={!selectedFixtureToStart}
                  onClick={() => selectedFixtureToStart && handleLaunchFixture(selectedFixtureToStart)}
                  style={{ width: '100%' }}
                >
                  Launch Selected Fixture
                </button>
              </div>
            </div>

            {/* Launch custom match */}
            <div>
              <strong style={{ display: 'block', fontSize: '0.98rem', marginBottom: 6 }}>Option B: Custom Match</strong>
              <p className="muted" style={{ fontSize: '0.85rem', marginBottom: 14 }}>Configure and start an independent match scoring session manually.</p>

              <form onSubmit={handleLaunchCustomMatch} className="form-grid" style={{ gap: 12 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <label style={{ flex: 1 }}>Team A Name:
                    <input
                      value={customStartForm.teamA}
                      onChange={(e) => setCustomStartForm(prev => ({ ...prev, teamA: e.target.value }))}
                      placeholder="e.g. INDIA"
                    />
                  </label>
                  <label style={{ flex: 1 }}>Team B Name:
                    <input
                      value={customStartForm.teamB}
                      onChange={(e) => setCustomStartForm(prev => ({ ...prev, teamB: e.target.value }))}
                      placeholder="e.g. AUSTRALIA"
                    />
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <label style={{ flex: 1 }}>Overs Limit:
                    <input
                      type="number"
                      value={customStartForm.overs}
                      onChange={(e) => setCustomStartForm(prev => ({ ...prev, overs: Number(e.target.value) }))}
                    />
                  </label>
                  <label style={{ flex: 1.5 }}>Venue:
                    <input
                      value={customStartForm.venue}
                      onChange={(e) => setCustomStartForm(prev => ({ ...prev, venue: e.target.value }))}
                      placeholder="e.g. Wankhede Stadium"
                    />
                  </label>
                </div>
                <button className="action-btn" type="submit" style={{ width: '100%' }}>
                  Start Custom Match
                </button>
              </form>
            </div>

          </div>
        </section>

      </div>
    );
  };

  const renderFanCenter = () => {
    if (!match) return <div className="card"><div className="skeleton skeleton-lg" /><div className="skeleton" style={{ marginTop: 10, width: '70%' }} /></div>;

    return (
      <div className="hero-grid">
        <section className="card">
          <div className="score-hero">
            <div>
              <p className="section-title">Live Fan Center</p>
              <p className="muted">{match.venue || 'Mumbai'} • {match.matchStatus.toUpperCase()} • Toss: {match.tossWinner === 'team_a' ? match.teamA.name : match.teamB.name} {match.tossDecidedTo === 'bat' ? 'bat' : 'bowl'}</p>
            </div>
            <div className="status-pill">
              <span className={`live-dot ${connection === 'offline' ? 'offline' : ''}`} />
              {connection === 'live' ? 'LIVE SYNCED' : 'OFFLINE'}
            </div>
          </div>
          <div className="score-hero" style={{ marginTop: 16 }}>
            <div className="team-stack">
              <img className="flag" src={match.teamA.flagUrl || 'https://flagcdn.com/w40/in.png'} alt={match.teamA.name} />
              <div>
                <div style={{ fontWeight: 700 }}>{match.teamA.name}</div>
                <div className="muted">{match.runs}/{match.wickets}</div>
              </div>
            </div>
            <div className="score-badge">
              <span className="score">{match.runs}</span>
              <span className="overs">/{match.wickets} • {overDisplay} ov</span>
            </div>
            <div className="team-stack">
              <img className="flag" src={match.teamB.flagUrl || 'https://flagcdn.com/w40/au.png'} alt={match.teamB.name} />
              <div>
                <div style={{ fontWeight: 700 }}>{match.teamB.name}</div>
                <div className="muted">{match.target ? `Target ${match.target}` : 'Run rate watch'}</div>
              </div>
            </div>
          </div>
          <div className="score-grid">
            <div className="stat-box"><span className="stat-label">Partnership</span><div className="stat-value">{match.currentPartnership.runs}/{match.currentPartnership.balls}</div></div>
            <div className="stat-box"><span className="stat-label">Strike Rate</span><div className="stat-value">{striker ? `${((striker.runsScored / Math.max(striker.ballsFaced, 1)) * 100).toFixed(1)}` : '0.0'}</div></div>
            <div className="stat-box"><span className="stat-label">Target</span><div className="stat-value">{match.target ? match.target : '—'}</div></div>
          </div>
          <div className="control-row" style={{ marginTop: 16 }}>
            <button className="ghost-btn" onClick={() => setTargetEnabled((current) => !current)}>Target Equation {targetEnabled ? 'ON' : 'OFF'}</button>
          </div>
        </section>
        <aside className="card">
          <p className="section-title">AI commentary</p>
          <p className="muted" style={{ lineHeight: 1.6 }}>{match.commentaryState || 'Waiting for fresh live insight'}</p>
          <div style={{ marginTop: 16 }}>
            <div className="section-title">Win probability</div>
            <div className="score-grid">
              <div className="stat-box"><span className="stat-label">Team A</span><div className="stat-value">{winProbability.home.toFixed(0)}%</div></div>
              <div className="stat-box"><span className="stat-label">Team B</span><div className="stat-value">{winProbability.away.toFixed(0)}%</div></div>
              <div className="stat-box"><span className="stat-label">Momentum</span><div className="stat-value">{match.runs > 80 ? 'High' : 'Balanced'}</div></div>
            </div>
          </div>
        </aside>
        <section className="card">
          <p className="section-title">Batting scorecard</p>
          <table className="table">
            <thead><tr><th>Batter</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead>
            <tbody>{battingTeam?.players.filter((player) => player.name).slice(0, 6).map((player) => (<tr key={player.id}><td>{player.name}</td><td>{player.runsScored}</td><td>{player.ballsFaced}</td><td>{player.fours}</td><td>{player.sixes}</td><td>{((player.runsScored / Math.max(player.ballsFaced, 1)) * 100).toFixed(1)}</td></tr>))}</tbody>
          </table>
        </section>
        <section className="card">
          <p className="section-title">Bowling scorecard</p>
          <table className="table">
            <thead><tr><th>Bowler</th><th>O</th><th>R</th><th>W</th><th>Econ</th></tr></thead>
            <tbody>{bowlingTeam?.players.filter((player) => player.name).slice(0, 6).map((player) => (<tr key={player.id}><td>{player.name}</td><td>{player.oversBowled.toFixed(1)}</td><td>{player.runsConceded}</td><td>{player.wicketsTaken}</td><td>{player.ballsBowled ? (player.runsConceded / (player.ballsBowled / 6)).toFixed(2) : '0.00'}</td></tr>))}</tbody>
          </table>
        </section>
        {targetEnabled ? (
          <section className="card">
            <p className="section-title">Target equation</p>
            <div className="muted">{targetEquation}</div>
            <div className="stat-box" style={{ marginTop: 10 }}><span className="stat-label">Chase equation</span><div className="stat-value">{match.target ? `${match.target - match.runs} runs from ${Math.max(0, match.maxOvers * 6 - match.legalBalls)} balls` : 'No target set'}</div></div>
          </section>
        ) : null}
      </div>
    );
  };

  const handleSwapBatsmen = async () => {
    if (!match) return;
    const response = await fetch('/api/match-state/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strikerId: match.nonStrikerId, nonStrikerId: match.strikerId })
    });
    const next = await response.json();
    setMatch(next);
    pushToast('🔄 Batsmen swapped', 'accent');
  };

  const handleApplyBowler = async (selectedId: string) => {
    if (!selectedId) return;
    if (match && match.legalBalls > 0 && match.legalBalls % 6 === 0) {
      const lastLegalBall = [...match.ballHistory].reverse().find(b => b.isLegalDelivery);
      if (lastLegalBall && lastLegalBall.bowlerId === selectedId) {
        pushToast('A bowler cannot bowl consecutive overs. Please select a different bowler.', 'danger');
        return;
      }
    }
    const response = await fetch('/api/match-state/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activeBowlerId: selectedId })
    });
    const next = await response.json();
    setMatch(next);
    pushToast('Bowler changed', 'accent');
  };

  const getBallDisplayText = (ball: any) => {
    if (ball.wicketEvent && ball.wicketEvent.type !== 'none') {
      return 'W';
    }
    if (ball.extraType === 'wide') {
      return `${ball.extraRuns}Wd`;
    }
    if (ball.extraType === 'no_ball') {
      return 'Nb';
    }
    if (ball.extraType === 'bye') {
      return `${ball.extraRuns}B`;
    }
    if (ball.extraType === 'leg_bye') {
      return `${ball.extraRuns}Lb`;
    }
    return ball.runsScored.toString();
  };

  const getBallBgColor = (text: string) => {
    if (text === 'W') return '#ef4444';
    if (text.includes('Wd') || text.includes('Nb')) return '#eab308';
    if (text === '4') return '#3b82f6';
    if (text === '6') return '#10b981';
    return 'rgba(255, 255, 255, 0.2)';
  };

  const renderBallHistoryRow = (size = 'small', align = 'left') => {
    if (!match || !match.ballHistory || match.ballHistory.length === 0) return null;
    
    const lastBall = match.ballHistory[match.ballHistory.length - 1];
    const lastOverNum = lastBall.overNum;
    const activeOverBalls = match.ballHistory.filter((b: any) => b.overNum === lastOverNum);
    const displayBalls = activeOverBalls.slice(-6);
    
    const chipSize = size === 'small' ? '20px' : '26px';
    const fontSize = size === 'small' ? '0.68rem' : '0.8rem';
    const justify = align === 'right' ? 'flex-end' : 'flex-start';
    
    return (
      <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center', justifyContent: justify }}>
        {displayBalls.map((ball: any) => {
          const text = getBallDisplayText(ball);
          const bg = getBallBgColor(text);
          return (
            <div
              key={ball.id}
              style={{
                width: chipSize,
                height: chipSize,
                borderRadius: '50%',
                background: bg,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: fontSize,
                fontWeight: 800,
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              {text}
            </div>
          );
        })}
      </div>
    );
  };

  const renderAdminDesk = () => {
    if (!match) return null;

    const crr = match.legalBalls > 0 ? (match.runs / (match.legalBalls / 6)).toFixed(2) : '0.00';
    const totalInningsBalls = match.maxOvers * 6;
    const ballsRemaining = Math.max(0, totalInningsBalls - match.legalBalls);
    const runsNeeded = match.target !== undefined ? Math.max(0, match.target - match.runs) : 0;
    const rrr = match.target !== undefined && ballsRemaining > 0 ? (runsNeeded / (ballsRemaining / 6)).toFixed(2) : '0.00';

    return (
      <div className="content-grid" style={{ gridTemplateColumns: '1fr', gap: 20 }}>
        {/* Live Scorecard Header */}
        <section className="card" style={{ background: 'var(--navy)', color: '#fff', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10, marginBottom: 12 }}>
            <p className="section-title" style={{ color: '#fff', fontSize: '1.1rem', margin: 0, border: 'none', padding: 0 }}>Live Scorecard Header</p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,0.06)', padding: '6px 14px', borderRadius: '12px' }}>
              {match.teamA.flagUrl && <img src={match.teamA.flagUrl} alt="" style={{ height: 22, width: 22, borderRadius: '50%', objectFit: 'cover', background: '#fff' }} />}
              <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{match.teamA.name}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 900, fontSize: '0.75rem' }}>VS</span>
              {match.teamB.flagUrl && <img src={match.teamB.flagUrl} alt="" style={{ height: 22, width: 22, borderRadius: '50%', objectFit: 'cover', background: '#fff' }} />}
              <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{match.teamB.name}</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16 }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 12, textAlign: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e0', textTransform: 'uppercase' }}>Runs</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent)' }}>{match.runs}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 12, textAlign: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e0', textTransform: 'uppercase' }}>Wickets</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--danger)' }}>{match.wickets}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 12, textAlign: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e0', textTransform: 'uppercase' }}>Overs</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{overDisplay}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 12, textAlign: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e0', textTransform: 'uppercase' }}>Run Rate (CRR)</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#63b3ed' }}>{crr}</div>
            </div>
            {match.currentInnings === 2 && match.target !== undefined && (
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 12, textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#cbd5e0', textTransform: 'uppercase' }}>Req. Rate (RRR)</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f56565' }}>{rrr}</div>
              </div>
            )}
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 12, textAlign: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e0', textTransform: 'uppercase' }}>Partnership</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: 4 }}>{match.currentPartnership.runs} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#a0aec0' }}>({match.currentPartnership.balls}b)</span></div>
            </div>
          </div>
          {match.currentInnings === 2 && match.target !== undefined && (
            <div style={{ marginTop: 15, padding: '10px 15px', background: 'rgba(239, 68, 68, 0.15)', borderLeft: '4px solid #ef4444', borderRadius: '6px', fontSize: '1rem', fontWeight: 700 }}>
              🎯 Target: {match.target} runs • Need {runsNeeded} runs off {ballsRemaining} balls (RRR: {rrr})
            </div>
          )}
        </section>

        {/* Broadcast Overlay Controls */}
        <section className="card" style={{ borderLeft: `4px solid ${obsConfig.accentColor}` }}>
          <p className="section-title">Broadcast Screen Controllers</p>
          <p className="muted" style={{ marginBottom: 12 }}>Quickly display fullscreen graphics or return to the live overlay scoreboard.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button 
              className="action-btn" 
              style={{ background: '#ef4444', color: '#fff', fontWeight: 800, padding: '8px 16px', borderRadius: '10px' }}
              onClick={() => handleUpdateObsConfig('plateMode', 'overlay')}
            >
              📺 Hide Screen (Show Scoreboard)
            </button>
            <button 
              className="ghost-btn" 
              style={{ border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '10px', background: 'transparent' }}
              onClick={() => handleUpdateObsConfig('plateMode', 'vs')}
            >
              👥 VS Splash
            </button>
            <button 
              className="ghost-btn" 
              style={{ border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '10px', background: 'transparent' }}
              onClick={() => handleUpdateObsConfig('plateMode', 'playing-xi')}
            >
              📋 Playing XI
            </button>
            <button 
              className="ghost-btn" 
              style={{ border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '10px', background: 'transparent' }}
              onClick={() => handleUpdateObsConfig('plateMode', 'batting-card')}
            >
              🏏 Batting Card
            </button>
            <button 
              className="ghost-btn" 
              style={{ border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '10px', background: 'transparent' }}
              onClick={() => handleUpdateObsConfig('plateMode', 'bowling-card')}
            >
              🥎 Bowling Card
            </button>
            <button 
              className="ghost-btn" 
              style={{ border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '10px', background: 'transparent' }}
              onClick={() => handleUpdateObsConfig('plateMode', 'match-summary')}
            >
              📊 Match Summary
            </button>
            <button 
              className="ghost-btn" 
              style={{ border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '10px', background: 'transparent' }}
              onClick={() => handleUpdateObsConfig('plateMode', 'winner')}
            >
              🏆 Winner Splash
            </button>
          </div>
          <div style={{ marginTop: 15, display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)' }}>CUSTOM NOTICE TEXT</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <input 
                value={customNoticeDraft} 
                onChange={(e) => setCustomNoticeDraft(e.target.value)} 
                placeholder="e.g. RAIN DELAY / LUNCH BREAK" 
                style={{ flex: 1, padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.9rem', fontWeight: 600 }}
              />
              <button 
                type="button"
                className="action-btn"
                onClick={async () => {
                  await handleUpdateObsConfig('customText', customNoticeDraft);
                  await handleUpdateObsConfig('plateMode', 'custom-text');
                  pushToast('Notice published to OBS!', 'accent');
                }}
                style={{ padding: '0 18px', borderRadius: '10px', fontWeight: 700 }}
              >
                Publish Notice
              </button>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted)' }}>
            Active Screen on OBS: <span style={{ color: obsConfig.accentColor, textTransform: 'uppercase', background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: '4px' }}>{obsConfig.plateMode === 'overlay' ? 'Live Scoreboard' : obsConfig.plateMode}</span>
          </div>
        </section>

        {/* Current Batters Section */}
        <section className="card">
          <p className="section-title">Current Batters Section</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 12 }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>Striker (On Strike)</span>
              {striker ? (
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--navy)' }}>🏏 {striker.name}</div>
              ) : (
                <div style={{ marginTop: 6 }}>
                  <select 
                    defaultValue="" 
                    onChange={async (e) => {
                      const selectedId = e.target.value;
                      if (!selectedId) return;
                      await fetch('/api/match-state/override', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ strikerId: selectedId })
                      });
                      refreshData();
                    }}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1.5px solid var(--accent)', fontSize: '0.9rem', fontWeight: 700, background: '#fff' }}
                  >
                    <option value="">Select next batter...</option>
                    {battingTeam?.players.filter(p => p.battingStatus === 'not_batting' && p.id !== match.nonStrikerId).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 12 }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>Non-Striker</span>
              {nonStriker ? (
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--navy)' }}>{nonStriker.name}</div>
              ) : (
                <div style={{ marginTop: 6 }}>
                  <select 
                    defaultValue="" 
                    onChange={async (e) => {
                      const selectedId = e.target.value;
                      if (!selectedId) return;
                      await fetch('/api/match-state/override', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nonStrikerId: selectedId })
                      });
                      refreshData();
                    }}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1.5px solid var(--accent)', fontSize: '0.9rem', fontWeight: 700, background: '#fff' }}
                  >
                    <option value="">Select next batter...</option>
                    {battingTeam?.players.filter(p => p.battingStatus === 'not_batting' && p.id !== match.strikerId).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <p className="section-title" style={{ fontSize: '1rem', marginTop: 18 }}>Batting Table</p>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                <th style={{ padding: 8 }}>Batter</th>
                <th style={{ padding: 8 }}>Role</th>
                <th style={{ padding: 8 }}>Runs</th>
                <th style={{ padding: 8 }}>Balls</th>
                <th style={{ padding: 8 }}>4s</th>
                <th style={{ padding: 8 }}>6s</th>
                <th style={{ padding: 8 }}>SR</th>
              </tr>
            </thead>
            <tbody>
              {striker && (
                <tr>
                  <td style={{ fontWeight: 700, padding: 8 }}>{striker.name} *</td>
                  <td style={{ padding: 8 }}>Striker</td>
                  <td style={{ padding: 8 }}>{striker.runsScored}</td>
                  <td style={{ padding: 8 }}>{striker.ballsFaced}</td>
                  <td style={{ padding: 8 }}>{striker.fours}</td>
                  <td style={{ padding: 8 }}>{striker.sixes}</td>
                  <td style={{ padding: 8 }}>{((striker.runsScored / Math.max(striker.ballsFaced, 1)) * 100).toFixed(1)}</td>
                </tr>
              )}
              {nonStriker && (
                <tr>
                  <td style={{ fontWeight: 600, padding: 8 }}>{nonStriker.name}</td>
                  <td style={{ padding: 8 }}>Non-Striker</td>
                  <td style={{ padding: 8 }}>{nonStriker.runsScored}</td>
                  <td style={{ padding: 8 }}>{nonStriker.ballsFaced}</td>
                  <td style={{ padding: 8 }}>{nonStriker.fours}</td>
                  <td style={{ padding: 8 }}>{nonStriker.sixes}</td>
                  <td style={{ padding: 8 }}>{((nonStriker.runsScored / Math.max(nonStriker.ballsFaced, 1)) * 100).toFixed(1)}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ marginTop: 14 }}>
            <button className="ghost-btn" style={{ border: '1px solid var(--border)' }} onClick={handleSwapBatsmen}>
              🔄 Swap Batsmen
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 14 }}>
            <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 800, display: 'block', marginBottom: 8 }}>Add New Batter (on the fly)</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Type name, e.g. M. Dhoni"
                value={batterName}
                onChange={(e) => setBatterName(e.target.value)}
                style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 12px', flex: 1, background: 'white' }}
              />
              <select
                value={batterRole}
                onChange={(e) => setBatterRole(e.target.value as 'striker' | 'non_striker')}
                style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 12px', background: 'white', fontWeight: 600 }}
              >
                <option value="striker">As Striker</option>
                <option value="non_striker">As Non-Striker</option>
              </select>
              <button className="action-btn" onClick={addBatter}>
                Add Batter
              </button>
            </div>
          </div>
        </section>

        {/* Bowler Section */}
        <section className="card">
          <p className="section-title">Bowler Section</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'center' }}>
            <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 12 }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>Active Bowler</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--navy)' }}>
                {bowler ? `${bowler.name} (${bowler.oversBowled.toFixed(1)} ov, ${bowler.runsConceded} runs, ${bowler.wicketsTaken} wkts)` : '—'}
              </div>
              {renderBallHistoryRow('medium')}
            </div>
            <div>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  id="active-bowler-select"
                  defaultValue={match.activeBowlerId || ""}
                  style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 12px', flex: 1, background: 'white' }}
                >
                  <option value="">Select Bowler</option>
                  {bowlingTeam?.players.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  className="action-btn"
                  onClick={() => {
                    const selectEl = document.getElementById('active-bowler-select') as HTMLSelectElement;
                    if (selectEl) handleApplyBowler(selectEl.value);
                  }}
                >
                  Apply Bowler
                </button>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 14 }}>
            <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 800, display: 'block', marginBottom: 8 }}>Add New Bowler (on the fly)</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Type name, e.g. J. Bumrah"
                value={bowlerName}
                onChange={(e) => setBowlerName(e.target.value)}
                style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 12px', flex: 1, background: 'white' }}
              />
              <button className="action-btn" onClick={addBowler}>
                Add Bowler
              </button>
            </div>
          </div>
        </section>

        {/* Run Scoring, Extras & Wicket Controls */}
        <section className="card" style={{ display: 'grid', gap: 18 }}>
          <div>
            <p className="section-title" style={{ fontSize: '0.9rem', marginBottom: 8 }}>Run Scoring Section</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[0, 1, 2, 3, 4, 6].map((runs) => (
                <button
                  key={runs}
                  className="action-btn"
                  style={{ minWidth: '54px', fontSize: '1.2rem', fontWeight: 800 }}
                  onClick={() => submitBall(runs, 'none', 0, 'none')}
                >
                  {runs}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="section-title" style={{ fontSize: '0.9rem', marginBottom: 8 }}>Extras Section</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: selectedExtraForRuns ? 10 : 0 }}>
              {[
                { label: 'Wide', type: 'wide' },
                { label: 'No Ball', type: 'no_ball' },
                { label: 'Bye', type: 'bye' },
                { label: 'Leg Bye', type: 'leg_bye' },
              ].map((extra) => (
                <button
                  key={extra.type}
                  className={selectedExtraForRuns === extra.type ? "action-btn" : "ghost-btn"}
                  style={{ border: '1px solid var(--border)' }}
                  onClick={() => setSelectedExtraForRuns(selectedExtraForRuns === extra.type ? null : extra.type)}
                >
                  {extra.label}
                </button>
              ))}
            </div>

            {selectedExtraForRuns && (
              <div className="card" style={{ padding: 12, background: 'var(--bg-light)', border: '1px dashed var(--border)', borderRadius: 12 }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 600 }}>
                  Select runs for {selectedExtraForRuns === 'wide' ? 'Wide' : selectedExtraForRuns === 'no_ball' ? 'No Ball' : selectedExtraForRuns === 'bye' ? 'Bye' : 'Leg Bye'}:
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {selectedExtraForRuns === 'wide' && [0, 1, 2, 3, 4].map(runs => (
                    <button
                      key={runs}
                      className="ghost-btn"
                      style={{ border: '1px solid var(--border)', padding: '6px 12px', fontSize: '0.9rem' }}
                      onClick={() => {
                        submitBall(runs, 'wide', 1, 'none');
                        setSelectedExtraForRuns(null);
                      }}
                    >
                      {runs === 0 ? 'Wide only' : `Wide + ${runs}`}
                    </button>
                  ))}
                  {selectedExtraForRuns === 'no_ball' && [0, 1, 2, 3, 4, 6].map(runs => (
                    <button
                      key={runs}
                      className="ghost-btn"
                      style={{ border: '1px solid var(--border)', padding: '6px 12px', fontSize: '0.9rem' }}
                      onClick={() => {
                        submitBall(runs, 'no_ball', 1, 'none');
                        setSelectedExtraForRuns(null);
                      }}
                    >
                      {runs === 0 ? 'No Ball only' : `No Ball + ${runs}`}
                    </button>
                  ))}
                  {(selectedExtraForRuns === 'bye' || selectedExtraForRuns === 'leg_bye') && [1, 2, 3, 4].map(runs => (
                    <button
                      key={runs}
                      className="ghost-btn"
                      style={{ border: '1px solid var(--border)', padding: '6px 12px', fontSize: '0.9rem' }}
                      onClick={() => {
                        submitBall(0, selectedExtraForRuns as 'bye' | 'leg_bye', runs, 'none');
                        setSelectedExtraForRuns(null);
                      }}
                    >
                      {runs} {runs === 1 ? 'Run' : 'Runs'}
                    </button>
                  ))}
                  <button
                    className="ghost-btn"
                    style={{ border: '1px solid var(--danger)', color: 'var(--danger)', marginLeft: 'auto', padding: '6px 12px', fontSize: '0.9rem' }}
                    onClick={() => setSelectedExtraForRuns(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <button
              className="action-btn"
              style={{ background: 'var(--danger)', color: '#fff', flex: 1 }}
              onClick={() => setWicketDraft({ open: true, type: 'bowled', dismissedPlayerId: striker?.id || '', fielderName: '' })}
            >
              Record Wicket
            </button>
            <button
              className="ghost-btn"
              style={{ border: '1px solid var(--border)', flex: 1 }}
              onClick={async () => {
                const response = await fetch('/api/match-state/undo', { method: 'POST' });
                const next = await response.json();
                setMatch(next);
                pushToast('Last delivery undone', 'danger');
              }}
            >
              Undo
            </button>
          </div>
        </section>

        {wicketDraft.open ? (
          <div className="card">
            <p className="section-title">Wicket capture</p>
            <div className="form-grid">
              <label>Wicket type<select value={wicketDraft.type} onChange={(e) => setWicketDraft((current) => ({ ...current, type: e.target.value }))}><option value="bowled">Bowled</option><option value="caught">Caught</option><option value="lbw">LBW</option><option value="stumped">Stumped</option><option value="run_out">Run Out</option></select></label>
              <label>Dismissed batsman
                <select value={wicketDraft.dismissedPlayerId} onChange={(e) => setWicketDraft((current) => ({ ...current, dismissedPlayerId: e.target.value }))}>
                  <option value="">Select batsman</option>
                  {battingTeam?.players.filter((player) => player.name && (player.id === match.strikerId || player.id === match.nonStrikerId)).map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name} {player.id === match.strikerId ? '(Striker)' : '(Non-Striker)'}
                    </option>
                  ))}
                </select>
              </label>
              <label>Fielder
                <select 
                  value={wicketDraft.fielderName} 
                  onChange={(e) => setWicketDraft((current) => ({ ...current, fielderName: e.target.value }))}
                >
                  <option value="">Select fielder</option>
                  {bowlingTeam?.players.filter((p) => p.name).map((p, idx) => (
                    <option key={p.id} value={p.name}>
                      {p.name} {idx >= 11 ? '(S)' : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="control-row" style={{ marginTop: 14 }}>
              <button className="action-btn" onClick={confirmWicket}>Confirm OUT</button>
              <button className="ghost-btn" onClick={() => setWicketDraft((current) => ({ ...current, open: false }))}>Cancel</button>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const renderTournamentDashboard = () => {
    const selectedTour = tournaments.find(t => t.id === selectedTournamentId);

    // Filter fixtures for TBD, completed and upcoming
    const completedFix = tournamentFixtures.filter(f => f.status === 'COMPLETED' || f.status === 'ABANDONED');
    const upcomingFix = tournamentFixtures.filter(f => f.status === 'SCHEDULED' || f.status === 'LIVE');

    // Group standings by group name
    const groupedStandings: Record<string, any[]> = {};
    tournamentStandings.forEach(item => {
      const g = item.group_name || 'LEAGUE';
      if (!groupedStandings[g]) groupedStandings[g] = [];
      groupedStandings[g].push(item);
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Tournament Selection & Header */}
        <section className="card" style={{ background: 'linear-gradient(135deg, var(--navy) 0%, #102a45 100%)', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <span className="badge highlight" style={{ background: 'var(--accent)', color: 'var(--navy)', fontWeight: 900 }}>TOURNAMENT DASHBOARD</span>
              <h2 style={{ margin: '8px 0 4px 0', fontSize: '1.8rem', fontWeight: 900 }}>{selectedTour?.name || 'SELECT A TOURNAMENT'}</h2>
              <p className="muted" style={{ margin: 0, color: '#a0aec0' }}>Format: {selectedTour?.format || 'League'} • Status: {selectedTour?.status || 'UPCOMING'}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontWeight: 600 }}>Active Tournament:</span>
              <select
                value={selectedTournamentId}
                onChange={(e) => setSelectedTournamentId(e.target.value)}
                style={{ background: '#172033', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, padding: '8px 12px', fontSize: '0.93rem', fontWeight: 600 }}
              >
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: 10, borderBottom: '2px solid var(--border)', paddingBottom: 10, flexWrap: 'wrap' }}>
          {(['dashboard', 'fixtures', 'standings', 'bracket', 'stats', 'admin'] as const).map((tab) => (
            <button
              key={tab}
              className={`pill-btn ${tournamentTab === tab ? 'active' : 'ghost-btn'}`}
              style={{
                textTransform: 'uppercase',
                fontSize: '0.8rem',
                letterSpacing: '0.08em',
                fontWeight: 700,
                background: tournamentTab === tab ? 'var(--navy)' : 'transparent',
                color: tournamentTab === tab ? '#fff' : 'var(--navy)',
                border: `1.5px solid ${tournamentTab === tab ? 'var(--navy)' : 'var(--border)'}`,
                borderRadius: '12px',
                padding: '10px 20px',
                minWidth: '100px',
                textAlign: 'center'
              }}
              onClick={() => setTournamentTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content Rendering */}
        {tournamentTab === 'dashboard' && (
          <div className="content-grid" style={{ gridTemplateColumns: '1fr 340px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="score-grid">
                <div className="stat-box" style={{ borderLeft: '4px solid var(--accent)' }}>
                  <span className="stat-label">Registered Teams</span>
                  <div className="stat-value">{tournamentTeams.length} Teams</div>
                </div>
                <div className="stat-box" style={{ borderLeft: '4px solid var(--teal)' }}>
                  <span className="stat-label">Matches Completed</span>
                  <div className="stat-value">{completedFix.length} Played</div>
                </div>
                <div className="stat-box" style={{ borderLeft: '4px solid var(--muted)' }}>
                  <span className="stat-label">Matches Scheduled</span>
                  <div className="stat-value">{upcomingFix.length} Left</div>
                </div>
              </div>

              {/* Recent Results */}
              <section className="card">
                <p className="section-title">Recent Match Results</p>
                {completedFix.length === 0 ? (
                  <p className="muted" style={{ padding: '20px 0', textAlign: 'center' }}>No completed matches in this tournament yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {completedFix.slice(0, 5).map(f => {
                      const outcomeText = f.is_no_result ? 'No Result' : f.is_tied ? 'Match Tied' : `${tournamentTeams.find(t => t.id === f.winner_team_id)?.name} Won`;
                      return (
                        <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)', padding: '14px 18px', borderRadius: 14, border: '1px solid var(--border)' }}>
                          <div>
                            <strong style={{ fontSize: '1.05rem', color: 'var(--navy)' }}>{f.team_a_name} vs {f.team_b_name}</strong>
                            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 4 }}>
                              {f.team_a_runs}/{f.team_a_wickets} vs {f.team_b_runs}/{f.team_b_wickets} • {f.stage}
                            </div>
                          </div>
                          <span className="badge highlight" style={{ background: 'rgba(0,223,162,0.15)', color: 'var(--navy)', fontWeight: 800 }}>{outcomeText}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* Upcoming Matchups */}
            <aside className="card">
              <p className="section-title">Upcoming Fixtures</p>
              {upcomingFix.length === 0 ? (
                <p className="muted" style={{ padding: '20px 0', textAlign: 'center' }}>All tournament matches completed!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {upcomingFix.slice(0, 8).map(f => (
                    <div key={f.id} style={{ background: 'var(--surface-2)', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)' }}>
                      <strong style={{ fontSize: '0.95rem', display: 'block', color: 'var(--navy)' }}>{f.team_a_name} vs {f.team_b_name}</strong>
                      <span className="muted" style={{ fontSize: '0.78rem', display: 'block', marginTop: 4 }}>Date: {f.match_date} • {f.match_time}</span>
                      <span className="muted" style={{ fontSize: '0.78rem', display: 'block' }}>Venue: {f.venue}</span>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </div>
        )}

        {tournamentTab === 'fixtures' && (
          <section className="card">
            <p className="section-title">Tournament Fixtures & Schedule</p>
            {tournamentFixtures.length === 0 ? (
              <p className="muted" style={{ padding: '40px 0', textAlign: 'center' }}>No fixtures generated. Go to Admin tab to generate round-robin schedule.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                {tournamentFixtures.map(f => {
                  const isCompleted = f.status === 'COMPLETED';
                  const isAbandoned = f.status === 'ABANDONED';
                  const winnerName = tournamentTeams.find(t => t.id === f.winner_team_id)?.name;
                  const resultSummary = isCompleted ? (f.is_tied ? 'Match Tied' : `${winnerName} won`) : isAbandoned ? 'Abandoned' : 'Scheduled';

                  return (
                    <div key={f.id} style={{ border: '1px solid var(--border)', borderRadius: 18, padding: 16, background: 'var(--surface)', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', gap: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--surface-2)', paddingBottom: 8 }}>
                        <span className="badge highlight" style={{ background: 'var(--surface-2)', fontWeight: 800 }}>{f.stage}</span>
                        <span className={`badge ${f.status === 'LIVE' ? 'accent' : 'highlight'}`}>{f.status}</span>
                      </div>
                      <div style={{ margin: '6px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '1.1rem' }}>{f.team_a_name}</strong>
                          {isCompleted && <span>{f.team_a_runs}/{f.team_a_wickets}</span>}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                          <strong style={{ fontSize: '1.1rem' }}>{f.team_b_name}</strong>
                          {isCompleted && <span>{f.team_b_runs}/{f.team_b_wickets}</span>}
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid var(--surface-2)', paddingTop: 8, fontSize: '0.82rem', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Venue: {f.venue}</span>
                        <strong>{resultSummary}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {tournamentTab === 'standings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {Object.keys(groupedStandings).length === 0 ? (
              <section className="card"><p className="muted" style={{ textAlign: 'center' }}>No standings data available. Register teams to compute standings.</p></section>
            ) : (
              Object.keys(groupedStandings).map(groupName => (
                <section key={groupName} className="card">
                  <p className="section-title" style={{ color: 'var(--teal)', fontSize: '1.2rem', marginBottom: 12 }}>Group: {groupName}</p>
                  <table className="table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ width: 60 }}>Pos</th>
                        <th>Team</th>
                        <th style={{ textAlign: 'center' }}>Played</th>
                        <th style={{ textAlign: 'center' }}>Won</th>
                        <th style={{ textAlign: 'center' }}>Lost</th>
                        <th style={{ textAlign: 'center' }}>Tied</th>
                        <th style={{ textAlign: 'center' }}>No Result</th>
                        <th style={{ textAlign: 'center' }}>NRR</th>
                        <th style={{ textAlign: 'center', fontWeight: 900 }}>Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedStandings[groupName].map((t, idx) => (
                        <tr key={t.team_id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td><strong>{idx + 1}</strong></td>
                          <td><strong>{t.team_name}</strong></td>
                          <td style={{ textAlign: 'center' }}>{t.played}</td>
                          <td style={{ textAlign: 'center', color: '#10b981', fontWeight: 700 }}>{t.won}</td>
                          <td style={{ textAlign: 'center', color: '#ef4444' }}>{t.lost}</td>
                          <td style={{ textAlign: 'center' }}>{t.tied}</td>
                          <td style={{ textAlign: 'center' }}>{t.noResult}</td>
                          <td style={{ textAlign: 'center', color: t.nrr >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>{t.nrr >= 0 ? `+${t.nrr.toFixed(3)}` : t.nrr.toFixed(3)}</td>
                          <td style={{ textAlign: 'center', fontSize: '1.05rem', fontWeight: 900, color: 'var(--navy)' }}>{t.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              ))
            )}
          </div>
        )}

        {tournamentTab === 'bracket' && (
          <section className="card" style={{ display: 'grid', gap: 20, overflowX: 'auto', padding: '30px 20px' }}>
            <p className="section-title">Tournament Bracket Modes</p>
            <div style={{ display: 'flex', gap: 40, minWidth: '800px', justifyAround: 'space-between', alignItems: 'center' }}>

              {/* Group Stage column */}
              <div>
                <h4 style={{ textAlign: 'center', textTransform: 'uppercase', color: 'var(--navy)' }}>Group Stage</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 15 }}>
                  {tournamentTeams.slice(0, 4).map((t, idx: number) => (
                    <div key={t.id} style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', width: 180 }}>
                      <span className="muted" style={{ fontSize: '0.78rem' }}>Team {idx + 1}</span>
                      <strong style={{ display: 'block', fontSize: '0.95rem' }}>{t.name}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: '2rem', color: 'var(--border)' }}>→</div>

              {/* Semi-Finals column */}
              <div>
                <h4 style={{ textAlign: 'center', textTransform: 'uppercase', color: 'var(--navy)' }}>Semi Finals</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 40, marginTop: 15 }}>
                  <div style={{ background: 'var(--surface)', padding: 12, borderRadius: 12, border: '2px solid var(--border)', width: 200 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: 6, borderBottom: '1px solid var(--surface-2)' }}>
                      <span>Match SF1</span>
                      <span style={{ color: 'var(--teal)', fontWeight: 700 }}>LIVE</span>
                    </div>
                    <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
                      <div>{tournamentTeams[0]?.name || 'TBD'}</div>
                      <div>{tournamentTeams[3]?.name || 'TBD'}</div>
                    </div>
                  </div>
                  <div style={{ background: 'var(--surface)', padding: 12, borderRadius: 12, border: '2px solid var(--border)', width: 200 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: 6, borderBottom: '1px solid var(--surface-2)' }}>
                      <span>Match SF2</span>
                      <span className="muted">Upcoming</span>
                    </div>
                    <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
                      <div>{tournamentTeams[1]?.name || 'TBD'}</div>
                      <div>{tournamentTeams[2]?.name || 'TBD'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '2rem', color: 'var(--border)' }}>→</div>

              {/* Finals column */}
              <div>
                <h4 style={{ textAlign: 'center', textTransform: 'uppercase', color: 'var(--navy)' }}>Grand Finale</h4>
                <div style={{ marginTop: 15 }}>
                  <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #020617 100%)', color: '#fff', padding: 16, borderRadius: 16, border: '2px solid var(--accent)', width: 220, textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase' }}>🏆 Final Match</span>
                    <div style={{ margin: '14px 0', display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 700, fontSize: '1.1rem' }}>
                      <div>Winner SF1</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>vs</div>
                      <div>Winner SF2</div>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#cbd5e0' }}>Lords Stadium, London</span>
                  </div>
                </div>
              </div>

            </div>
          </section>
        )}

        {tournamentTab === 'stats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Top row: Runs and Wickets */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Top Run Scorers */}
              <section className="card">
                <p className="section-title" style={{ color: 'var(--navy)' }}>🏏 Top Run Scorers</p>
                {(!statsData.mostRuns || statsData.mostRuns.length === 0) ? (
                  <p className="muted" style={{ padding: '20px 0', textAlign: 'center' }}>No batting statistics recorded yet.</p>
                ) : (
                  <table className="table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Team</th>
                        <th style={{ textAlign: 'right' }}>Matches</th>
                        <th style={{ textAlign: 'right' }}>Runs</th>
                        <th style={{ textAlign: 'right' }}>Balls</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsData.mostRuns.map((p, idx: number) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td><strong>{p.player}</strong></td>
                          <td><span className="muted" style={{ fontSize: '0.85rem' }}>{p.team}</span></td>
                          <td style={{ textAlign: 'right' }}>{p.m}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--navy)' }}>{p.runs}</td>
                          <td style={{ textAlign: 'right' }}>{p.balls}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>

              {/* Top Wicket Takers */}
              <section className="card">
                <p className="section-title" style={{ color: 'var(--teal)' }}>🔴 Top Wicket Takers</p>
                {(!statsData.mostWickets || statsData.mostWickets.length === 0) ? (
                  <p className="muted" style={{ padding: '20px 0', textAlign: 'center' }}>No bowling statistics recorded yet.</p>
                ) : (
                  <table className="table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Team</th>
                        <th style={{ textAlign: 'right' }}>Matches</th>
                        <th style={{ textAlign: 'right' }}>Wickets</th>
                        <th style={{ textAlign: 'right' }}>Runs Conc</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsData.mostWickets.map((p, idx: number) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td><strong>{p.player}</strong></td>
                          <td><span className="muted" style={{ fontSize: '0.85rem' }}>{p.team}</span></td>
                          <td style={{ textAlign: 'right' }}>{p.m}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--teal)' }}>{p.wkts}</td>
                          <td style={{ textAlign: 'right' }}>{p.runsConceded}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </div>

            {/* Second row: Sixes and Fours */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Highest Sixes Hitters */}
              <section className="card">
                <p className="section-title" style={{ color: '#ec4899' }}>🚀 Highest Sixes Hitters</p>
                {(!statsData.mostSixes || statsData.mostSixes.length === 0) ? (
                  <p className="muted" style={{ padding: '20px 0', textAlign: 'center' }}>No sixes hit yet.</p>
                ) : (
                  <table className="table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Team</th>
                        <th style={{ textAlign: 'right' }}>Matches</th>
                        <th style={{ textAlign: 'right' }}>Sixes</th>
                        <th style={{ textAlign: 'right' }}>Runs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsData.mostSixes.map((p, idx: number) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td><strong>{p.player}</strong></td>
                          <td><span className="muted" style={{ fontSize: '0.85rem' }}>{p.team}</span></td>
                          <td style={{ textAlign: 'right' }}>{p.m}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#ec4899' }}>{p.sixes}</td>
                          <td style={{ textAlign: 'right' }}>{p.runs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>

              {/* Highest Fours Hitters */}
              <section className="card">
                <p className="section-title" style={{ color: '#f59e0b' }}>💥 Highest Fours Hitters</p>
                {(!statsData.mostFours || statsData.mostFours.length === 0) ? (
                  <p className="muted" style={{ padding: '20px 0', textAlign: 'center' }}>No fours hit yet.</p>
                ) : (
                  <table className="table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Team</th>
                        <th style={{ textAlign: 'right' }}>Matches</th>
                        <th style={{ textAlign: 'right' }}>Fours</th>
                        <th style={{ textAlign: 'right' }}>Runs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsData.mostFours.map((p, idx: number) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td><strong>{p.player}</strong></td>
                          <td><span className="muted" style={{ fontSize: '0.85rem' }}>{p.team}</span></td>
                          <td style={{ textAlign: 'right' }}>{p.m}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#f59e0b' }}>{p.fours}</td>
                          <td style={{ textAlign: 'right' }}>{p.runs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </div>

            {/* Third row: Best Strike Rates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
              <section className="card">
                <p className="section-title" style={{ color: '#10b981' }}>⚡ Best Batting Strike Rates</p>
                {(!statsData.bestSR || statsData.bestSR.length === 0) ? (
                  <p className="muted" style={{ padding: '20px 0', textAlign: 'center' }}>No strike rate data available yet (min 10 runs).</p>
                ) : (
                  <table className="table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Team</th>
                        <th style={{ textAlign: 'right' }}>Matches</th>
                        <th style={{ textAlign: 'right' }}>Strike Rate</th>
                        <th style={{ textAlign: 'right' }}>Runs</th>
                        <th style={{ textAlign: 'right' }}>Balls Faced</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsData.bestSR.map((p, idx: number) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td><strong>{p.player}</strong></td>
                          <td><span className="muted" style={{ fontSize: '0.85rem' }}>{p.team}</span></td>
                          <td style={{ textAlign: 'right' }}>{p.m}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#10b981' }}>{p.sr}</td>
                          <td style={{ textAlign: 'right' }}>{p.runs}</td>
                          <td style={{ textAlign: 'right' }}>{p.balls}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </div>
          </div>
        )}

        {tournamentTab === 'admin' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Create Tournament */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <section className="card">
                <p className="section-title">Create New Tournament</p>
                <form onSubmit={handleCreateTournament} className="form-grid">
                  <label>Tournament Name:
                    <input
                      value={newTournamentForm.name}
                      onChange={(e) => setNewTournamentForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Nepal Premier League"
                    />
                  </label>
                  <label>Format:
                    <select
                      value={newTournamentForm.format}
                      onChange={(e) => setNewTournamentForm(prev => ({ ...prev, format: e.target.value }))}
                    >
                      <option value="League">League</option>
                      <option value="GROUP_KNOCKOUT">Group Knockout</option>
                      <option value="ROUND_ROBIN">Round Robin</option>
                    </select>
                  </label>
                  <label>Number of Groups:
                    <input
                      type="number"
                      value={newTournamentForm.config_num_groups}
                      onChange={(e) => setNewTournamentForm(prev => ({ ...prev, config_num_groups: Number(e.target.value) }))}
                    />
                  </label>
                  <label>Matches per Team:
                    <input
                      type="number"
                      value={newTournamentForm.config_matches_per_team}
                      onChange={(e) => setNewTournamentForm(prev => ({ ...prev, config_matches_per_team: Number(e.target.value) }))}
                    />
                  </label>
                  <button className="action-btn" type="submit" style={{ marginTop: 8 }}>Create Tournament</button>
                </form>
              </section>

              {/* Register Team */}
              <section className="card">
                <p className="section-title">Register Team</p>
                <form onSubmit={handleRegisterTeam} className="form-grid">
                  <label>Team Name:
                    <input
                      value={newTeamForm.name}
                      onChange={(e) => setNewTeamForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Kathmandu Kings"
                    />
                  </label>
                  <label>Logo URL (optional):
                    <input
                      value={newTeamForm.logo_url}
                      onChange={(e) => setNewTeamForm(prev => ({ ...prev, logo_url: e.target.value }))}
                      placeholder="https://example.com/logo.jpg"
                    />
                  </label>
                  <label>Group Name:
                    <input
                      value={newTeamForm.group_name}
                      onChange={(e) => setNewTeamForm(prev => ({ ...prev, group_name: e.target.value }))}
                      placeholder="e.g. GROUP A / LEAGUE"
                    />
                  </label>
                  <button className="action-btn" type="submit" style={{ marginTop: 8 }}>Register Team</button>
                </form>
              </section>
            </div>

            {/* Manage Teams */}
            <section className="card">
              <p className="section-title">Manage Registered Teams</p>
              {tournamentTeams.length === 0 ? (
                <p className="muted" style={{ padding: '20px 0', textAlign: 'center' }}>No teams registered for this tournament yet.</p>
              ) : (
                <table className="table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Team Name</th>
                      <th>Group Name</th>
                      <th>Manual Point Deduction</th>
                      <th style={{ width: 240, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournamentTeams.map(t => {
                      const isEditing = editTeamId === t.id;
                      return (
                        <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td>
                            {isEditing ? (
                              <input
                                value={editTeamForm.name}
                                onChange={(e) => setEditTeamForm(prev => ({ ...prev, name: e.target.value }))}
                              />
                            ) : (
                              <strong>{t.name}</strong>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                value={editTeamForm.group_name}
                                onChange={(e) => setEditTeamForm(prev => ({ ...prev, group_name: e.target.value }))}
                              />
                            ) : (
                              <span>{t.group_name || 'LEAGUE'}</span>
                            )}
                          </td>
                          <td>
                            <input
                              type="number"
                              defaultValue={t.manual_point_deductions}
                              onBlur={(e) => handleApplyPointsDeduction(t.id, Number(e.target.value))}
                              style={{ width: 80, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--border)' }}
                            />
                          </td>
                          <td style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            {isEditing ? (
                              <>
                                <button className="action-btn" onClick={() => handleUpdateTeam(t.id)} style={{ padding: '6px 12px', minHeight: 34 }}>Save</button>
                                <button className="ghost-btn" onClick={() => setEditTeamId(null)} style={{ padding: '6px 12px', minHeight: 34 }}>Cancel</button>
                              </>
                            ) : (
                              <>
                                <button className="ghost-btn" onClick={() => { setEditTeamId(t.id); setEditTeamForm({ name: t.name, logo_url: t.logo_url || '', group_name: t.group_name || 'LEAGUE' }); }} style={{ padding: '6px 12px', minHeight: 34 }}>Edit</button>
                                <button className="ghost-btn" onClick={() => handleDeleteTeam(t.id)} style={{ padding: '6px 12px', minHeight: 34, background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>Delete</button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </section>

            {/* Generate & Manual Results override */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <section className="card">
                <p className="section-title">Schedule Generator</p>
                <p className="muted" style={{ marginBottom: 15 }}>Automatically generate round robin match fixtures for all registered teams grouped together.</p>
                <button className="action-btn" onClick={handleGenerateFixtures} style={{ width: '100%', padding: '12px 0' }}>Generate Round Robin Fixtures</button>
              </section>

              <section className="card">
                <p className="section-title">Record Manual Result</p>
                <div className="form-grid">
                  <label>Fixture:
                    <select
                      value={fixtureResultDraft.fixtureId}
                      onChange={(e) => setFixtureResultDraft(current => ({ ...current, fixtureId: e.target.value }))}
                    >
                      <option value="">Select fixture</option>
                      {tournamentFixtures.filter(f => f.status === 'SCHEDULED' || f.status === 'LIVE').map(f => (
                        <option key={f.id} value={f.id}>{f.team_a_name} vs {f.team_b_name}</option>
                      ))}
                    </select>
                  </label>
                  <label>Winner:
                    <select
                      value={fixtureResultDraft.winner}
                      onChange={(e) => setFixtureResultDraft(current => ({ ...current, winner: e.target.value }))}
                    >
                      <option value="none">No winner (Tie/Abandoned)</option>
                      {tournamentTeams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </label>
                  <div style={{ display: 'flex', gap: 20, marginTop: 6 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={fixtureResultDraft.tied}
                        onChange={(e) => setFixtureResultDraft(current => ({ ...current, tied: e.target.checked }))}
                      />
                      Is Tied
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={fixtureResultDraft.noResult}
                        onChange={(e) => setFixtureResultDraft(current => ({ ...current, noResult: e.target.checked }))}
                      />
                      No Result (Abandoned)
                    </label>
                  </div>
                  <button
                    className="action-btn"
                    onClick={() => fixtureResultDraft.fixtureId && handleApplyFixtureResult(fixtureResultDraft.fixtureId)}
                    style={{ marginTop: 8 }}
                  >
                    Apply Result
                  </button>
                </div>
              </section>
            </div>

          </div>
        )}
      </div>
    );
  };

  const renderOverlayGraphicDirect = () => {
    if (!match) return null;

    const batTeam = match.battingTeamId === 'team_a' ? match.teamA : match.teamB;
    const bowlTeam = match.bowlingTeamId === 'team_a' ? match.teamA : match.teamB;
    const activeStriker = batTeam.players.find(p => p.id === match.strikerId);
    const activeNonStriker = batTeam.players.find(p => p.id === match.nonStrikerId);
    const activeBowler = bowlTeam.players.find(p => p.id === match.activeBowlerId);

    const crr = match.legalBalls > 0 ? (match.runs / (match.legalBalls / 6)).toFixed(2) : '0.00';
    const totalInningsBalls = match.maxOvers * 6;
    const ballsRemaining = Math.max(0, totalInningsBalls - match.legalBalls);
    const runsNeeded = match.target !== undefined ? Math.max(0, match.target - match.runs) : 0;
    const rrr = match.target !== undefined && ballsRemaining > 0 ? (runsNeeded / (ballsRemaining / 6)).toFixed(2) : '0.00';

    const resolvedFont = match.activeFont || obsConfig.fontFamily;
    const resolvedPlateMode = match.activeFullScreenPlate || obsConfig.plateMode;
    const resolvedAccentColor = match.activeAccent || obsConfig.accentColor;
    const resolvedBranding = match.activeBranding || obsConfig.branding;
    const resolvedTournamentName = match.activeTournamentName || obsConfig.tournamentName;
    const resolvedCustomText = match.customTextPlate || obsConfig.customText;
    const resolvedLogoUrl = match.sponsorLogoUrl || obsConfig.logoUrl;

    const themeStyle: React.CSSProperties = {
      fontFamily: resolvedFont ? `'${resolvedFont}', sans-serif` : "'Space Grotesk', sans-serif"
    };

    // Top Bar Info string computation
    const resolvedTopBarMode = obsConfig.topBarInfoMode || 'auto';
    let currentMode = resolvedTopBarMode;
    if (resolvedTopBarMode === 'auto') {
      currentMode = topBarCycleIndex === 0 ? 'chase' : topBarCycleIndex === 1 ? 'branding' : 'venue';
    }

    let topLeftText = '';
    let topCenterText = '';
    let topRightText = '';

    if (currentMode === 'chase') {
      if (match.currentInnings === 2 && match.target !== undefined) {
        topLeftText = `TARGET: ${match.target} • NEEDED: ${runsNeeded} RUNS IN ${ballsRemaining} BALLS`;
      } else {
        const projectedScore = match.legalBalls > 0 ? Math.round((match.runs / match.legalBalls) * (match.maxOvers * 6)) : 0;
        topLeftText = `1ST INNINGS • PROJECTED: ${projectedScore}`;
      }
      topCenterText = `CRR: ${crr} ${match.currentInnings === 2 && match.target !== undefined ? `• RRR: ${rrr}` : ''}`;
      topRightText = `PARTNERSHIP: ${match.currentPartnership?.runs || 0} (${match.currentPartnership?.balls || 0}b)`;
    } else if (currentMode === 'branding') {
      topLeftText = `${resolvedBranding || 'CRICPULSE'} LIVE`;
      topCenterText = `${resolvedTournamentName || 'ICC CHAMPIONS TROPHY'}`;
      topRightText = `${match.venue || 'LIVE MATCH'}`;
    } else {
      topLeftText = `${match.venue || 'LIVE MATCH'}`;
      topCenterText = `PARTNERSHIP: ${match.currentPartnership?.runs || 0} (${match.currentPartnership?.balls || 0}b)`;
      topRightText = `CRR: ${crr} ${match.currentInnings === 2 && match.target !== undefined ? `• RRR: ${rrr}` : ''}`;
    }

    const renderActiveMilestone = () => {
      if (activeMilestone === 'none') return null;
      let milestonePlayer: any = null;
      const lastBall = match.ballHistory[match.ballHistory.length - 1];

      if (activeMilestone === 'four' || activeMilestone === 'six') {
        const strikerId = lastBall ? lastBall.strikerId : match.strikerId;
        milestonePlayer = batTeam.players.find(p => p.id === strikerId) || null;
      } else if (activeMilestone === 'wicket') {
        const dismissedId = lastBall?.wicketEvent?.dismissedPlayerId || match.lastDismissedPlayer?.id;
        milestonePlayer = dismissedId 
          ? (match.teamA.players.find(p => p.id === dismissedId) || match.teamB.players.find(p => p.id === dismissedId) || null)
          : null;
      }

      const playerSR = milestonePlayer 
        ? ((milestonePlayer.runsScored / Math.max(milestonePlayer.ballsFaced, 1)) * 100).toFixed(1)
        : '0.0';

      let dismissalString = '';
      if (activeMilestone === 'wicket') {
        if (lastBall?.wicketEvent) {
          const w = lastBall.wicketEvent;
          const f = w.fielderName ? ` ${w.fielderName}` : '';
          dismissalString = w.type === 'bowled' ? 'b. Bowler' : w.type === 'caught' ? `c.${f} b. Bowler` : w.type === 'run_out' ? `run out (${w.fielderName || 'fielder'})` : w.type === 'lbw' ? 'lbw b. Bowler' : 'Dismissed';
        } else {
          dismissalString = 'Dismissed';
        }
      }

      const isBoundary = activeMilestone === 'four' || activeMilestone === 'six';

      return (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: isBoundary ? 'transparent' : 'rgba(2, 6, 23, 0.75)',
          backdropFilter: isBoundary ? 'none' : 'blur(16px)',
          zIndex: 9999,
          animation: 'fadeIn 0.4s ease-out',
          overflow: 'hidden'
        }}>
          {isBoundary ? (
            /* Compact floating capsule card for boundaries */
            <div style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(8, 10, 18, 0.96) 100%)',
              border: `3.5px solid ${activeMilestone === 'four' ? '#c3f400' : '#00dfa2'}`,
              borderRadius: '28px',
              padding: '24px 60px',
              boxShadow: `0 30px 70px rgba(0, 0, 0, 0.85), 0 0 45px ${activeMilestone === 'four' ? 'rgba(195, 244, 0, 0.35)' : 'rgba(0, 223, 162, 0.35)'}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              animation: activeMilestone === 'six' 
                ? 'maximumEntrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' 
                : 'crackingFourEntrance 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
              position: 'relative',
              maxWidth: '90vw',
              minWidth: '400px',
              overflow: 'hidden'
            }}>
              {/* Rotating Lens Flare inside smaller card */}
              <div style={{
                position: 'absolute',
                width: '400px',
                height: '400px',
                background: activeMilestone === 'four' ? 'radial-gradient(circle, rgba(195, 244, 0, 0.16) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(0, 223, 162, 0.16) 0%, transparent 70%)',
                animation: 'lensRotation 12s infinite linear',
                pointerEvents: 'none',
                zIndex: 1,
              }} />
              
              <div style={{ zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Milestone Big Text */}
                <div style={{
                  fontSize: activeMilestone === 'six' ? '5.2rem' : '4.0rem',
                  fontWeight: 950,
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  color: activeMilestone === 'four' ? '#c3f400' : '#00dfa2',
                  textShadow: activeMilestone === 'four' 
                    ? '0 0 35px rgba(195, 244, 0, 0.7)' 
                    : '0 0 45px rgba(0, 223, 162, 0.85)',
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
                }}>
                  {activeMilestone === 'four' ? 'CRACKING FOUR' : 'MAXIMUM'}
                </div>

                {/* Animated Expanding Glow Line */}
                <div style={{
                  height: '3px',
                  width: '90%',
                  background: activeMilestone === 'four' ? 'linear-gradient(90deg, transparent, #c3f400, transparent)' : 'linear-gradient(90deg, transparent, #00dfa2, transparent)',
                  boxShadow: `0 0 10px ${activeMilestone === 'four' ? '#c3f400' : '#00dfa2'}`,
                  animation: 'lineExpand 0.7s ease-out forwards',
                  marginTop: '12px',
                  borderRadius: '2px'
                }} />
              </div>
            </div>
          ) : (
            /* Wicket Overlay Style */
            <>
              {/* Sliding Slash Panels */}
              <div className="wicket-backdrop-slash-left" />
              <div className="wicket-backdrop-slash-right" />

              {/* Rotating Lens Flare Background */}
              <div style={{
                position: 'absolute',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(239, 68, 68, 0.18) 0%, transparent 70%)',
                animation: 'lensRotation 10s infinite linear',
                pointerEvents: 'none',
                zIndex: 2,
              }} />

              <div style={{
                width: '100%',
                maxWidth: '640px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                position: 'relative',
                zIndex: 10
              }}>
                {/* Milestone Big Text */}
                <div style={{
                  fontSize: '6.2rem',
                  fontWeight: 950,
                  textTransform: 'uppercase',
                  letterSpacing: '0.22em',
                  color: '#ef4444',
                  textShadow: '0 0 50px rgba(239, 68, 68, 0.8), 0 0 100px rgba(239, 68, 68, 0.4)',
                  marginBottom: '10px',
                  animation: 'wicketEntrance 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
                  animationDelay: '0.25s',
                  textAlign: 'center',
                }}>
                  WICKET
                </div>

                {/* Animated Expanding Glow Line */}
                <div style={{
                  height: '4px',
                  width: '90%',
                  background: 'linear-gradient(90deg, transparent, #ef4444, transparent)',
                  boxShadow: '0 0 15px #ef4444',
                  animation: 'lineExpand 0.7s ease-out both',
                  animationDelay: '0.45s',
                  marginBottom: '35px',
                  borderRadius: '2px'
                }} />

                {/* Batsman Detail Card */}
                {milestonePlayer && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
                    border: '3px solid #ef4444',
                    borderRadius: '32px',
                    padding: '30px 40px',
                    width: '92%',
                    maxWidth: '540px',
                    boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(239, 68, 68, 0.2)',
                    textAlign: 'center',
                    animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both, glowRedPulse 1.5s infinite alternate',
                    animationDelay: '0.65s, 1.25s',
                    color: '#fff',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '-50%',
                      left: '-50%',
                      width: '200%',
                      height: '200%',
                      background: 'radial-gradient(circle, rgba(239, 68, 68, 0.03) 0%, transparent 70%)',
                      pointerEvents: 'none'
                    }} />
                    
                    <span style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: 900, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.2em', 
                      color: '#fca5a5',
                      display: 'block',
                      marginBottom: '10px'
                    }}>
                      ☝️ DISMISSED BATSMAN
                    </span>
                    
                    <h2 style={{ fontSize: '2.8rem', fontWeight: 950, margin: '0 0 6px 0', letterSpacing: '-0.02em', color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                      {milestonePlayer.name}
                    </h2>

                    {dismissalString && (
                      <div style={{
                        display: 'inline-block',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#fca5a5',
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '6px 16px',
                        borderRadius: '999px',
                        marginBottom: '20px',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                      }}>
                        {dismissalString}
                      </div>
                    )}
                    
                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px', marginTop: '0' }}>
                      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px 8px' }}>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>Runs</div>
                        <div style={{ fontSize: '2.2rem', fontWeight: 950, color: '#fff' }}>{milestonePlayer.runsScored}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px 8px' }}>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>Balls</div>
                        <div style={{ fontSize: '2.2rem', fontWeight: 950, color: '#fff' }}>{milestonePlayer.ballsFaced}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px 8px' }}>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>Strike Rate</div>
                        <div style={{ fontSize: '2.2rem', fontWeight: 950, color: '#fff' }}>{playerSR}</div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '12px' }}>
                        <span style={{ fontSize: '0.95rem', color: '#cbd5e0', fontWeight: 700 }}>Fours (4s)</span>
                        <strong style={{ fontSize: '1.6rem', color: '#c3f400', fontWeight: 900 }}>{milestonePlayer.fours}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '12px' }}>
                        <span style={{ fontSize: '0.95rem', color: '#cbd5e0', fontWeight: 700 }}>Sixes (6s)</span>
                        <strong style={{ fontSize: '1.6rem', color: '#00dfa2', fontWeight: 900 }}>{milestonePlayer.sixes}</strong>
                      </div>
                    </div>
                  </div>
                )}
                
                <div style={{ fontSize: '1.5rem', marginTop: '30px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {match.teamA.name} vs {match.teamB.name}
                </div>
              </div>
            </>
          )}
        </div>
      );
    };

    if (resolvedPlateMode === 'vs') {
      return (
        <div className="premium-plate-wrapper glow-card" style={{ ...themeStyle, width: '100%', maxWidth: '95vw', background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)', borderRadius: 24, padding: '40px 30px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', position: 'relative' }}>
          {obsConfig.logoUrl && <img src={obsConfig.logoUrl} alt="Logo" style={{ height: 60, marginBottom: 20, objectFit: 'contain' }} />}
          <div style={{ fontSize: '1.2rem', color: obsConfig.accentColor, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em' }}>{obsConfig.branding || 'CRICPULSE'} PRESENTATION</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: 10, marginBottom: 40, textTransform: 'uppercase' }}>{obsConfig.tournamentName || 'ICC CHAMPIONS TROPHY'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 20 }}>
            <div>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: '#fff' }}>{match.teamA.name}</div>
              <div style={{ fontSize: '1rem', color: '#cbd5e0', marginTop: 10 }}>SQUAD A</div>
            </div>
            <div style={{ background: obsConfig.accentColor, color: '#fff', borderRadius: '50%', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 950 }}>VS</div>
            <div>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: '#fff' }}>{match.teamB.name}</div>
              <div style={{ fontSize: '1rem', color: '#cbd5e0', marginTop: 10 }}>SQUAD B</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 40, paddingTop: 20, fontSize: '1.1rem', color: '#94a3b8' }}>
            Venue: {match.venue || 'International Ground'} • Overs: {match.maxOvers} Ov
          </div>
        </div>
      );
    }

    if (resolvedPlateMode === 'playing-xi') {
      return (
        <div className="premium-plate-wrapper glow-card" style={{ ...themeStyle, width: '100%', maxWidth: '95vw', background: 'linear-gradient(135deg, #1e1b4b 0%, #030712 100%)', borderRadius: 24, padding: '40px 30px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 15, marginBottom: 25 }}>
            <div>
              <div style={{ fontSize: '1.1rem', color: obsConfig.accentColor, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>PLAYING XI</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff' }}>{batTeam.name}</div>
            </div>
            {obsConfig.logoUrl && <img src={obsConfig.logoUrl} alt="Logo" style={{ height: 50, objectFit: 'contain' }} />}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 40px' }}>
            {batTeam.players.slice(0, 11).map((p, idx) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6 }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>{idx + 1}. {p.name}</span>
                <span style={{ color: '#94a3b8', fontSize: '1rem' }}>{idx === 0 ? '(C)' : idx === 1 ? '(W)' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (resolvedPlateMode === 'batting-card') {
      return (
        <div className="premium-plate-wrapper glow-card" style={{ ...themeStyle, width: '100%', maxWidth: '95vw', background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)', borderRadius: 24, padding: '40px 30px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 15, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: '1.1rem', color: obsConfig.accentColor, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>BATTING SCORECARD</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff' }}>{batTeam.name} Innings</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 950, color: obsConfig.accentColor }}>{match.runs}-{match.wickets}</div>
              <div style={{ fontSize: '1rem', color: '#94a3b8' }}>Overs {overDisplay}/{match.maxOvers}</div>
            </div>
          </div>
          <table className="table" style={{ width: '100%', fontSize: '1.1rem' }}>
            <thead>
              <tr style={{ color: '#cbd5e0', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                <th style={{ textAlign: 'left', padding: '10px 6px' }}>Batsman</th>
                <th style={{ textAlign: 'right', padding: '10px 6px' }}>Runs</th>
                <th style={{ textAlign: 'right', padding: '10px 6px' }}>Balls</th>
                <th style={{ textAlign: 'right', padding: '10px 6px' }}>4s</th>
                <th style={{ textAlign: 'right', padding: '10px 6px' }}>6s</th>
                <th style={{ textAlign: 'right', padding: '10px 6px' }}>SR</th>
              </tr>
            </thead>
            <tbody>
              {batTeam.players.filter(p => p.name).map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
                  <td style={{ padding: '10px 6px', fontWeight: 600 }}>{p.id === match.strikerId ? '🏏 ' : ''}{p.name}</td>
                  <td style={{ textAlign: 'right', padding: '10px 6px', fontWeight: 700 }}>{p.runsScored}</td>
                  <td style={{ textAlign: 'right', padding: '10px 6px', color: '#94a3b8' }}>{p.ballsFaced}</td>
                  <td style={{ textAlign: 'right', padding: '10px 6px' }}>{p.fours}</td>
                  <td style={{ textAlign: 'right', padding: '10px 6px' }}>{p.sixes}</td>
                  <td style={{ textAlign: 'right', padding: '10px 6px', color: obsConfig.accentColor }}>{((p.runsScored / Math.max(p.ballsFaced, 1)) * 100).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (resolvedPlateMode === 'bowling-card') {
      return (
        <div className="premium-plate-wrapper glow-card" style={{ ...themeStyle, width: '100%', maxWidth: '95vw', background: 'linear-gradient(135deg, #021526 0%, #01070e 100%)', borderRadius: 24, padding: '40px 30px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 15, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: '1.1rem', color: obsConfig.accentColor, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>BOWLING CARD</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff' }}>{bowlTeam.name} Bowlers</div>
            </div>
            {obsConfig.logoUrl && <img src={obsConfig.logoUrl} alt="Logo" style={{ height: 50, objectFit: 'contain' }} />}
          </div>
          <table className="table" style={{ width: '100%', fontSize: '1.1rem' }}>
            <thead>
              <tr style={{ color: obsConfig.accentColor, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ textAlign: 'left', padding: '10px 6px' }}>Bowler</th>
                <th style={{ textAlign: 'right', padding: '10px 6px' }}>Overs</th>
                <th style={{ textAlign: 'right', padding: '10px 6px' }}>Runs</th>
                <th style={{ textAlign: 'right', padding: '10px 6px' }}>Wickets</th>
                <th style={{ textAlign: 'right', padding: '10px 6px' }}>Economy</th>
              </tr>
            </thead>
            <tbody>
              {bowlTeam.players.filter(p => p.name && (p.ballsBowled > 0 || p.id === match.activeBowlerId)).map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
                  <td style={{ padding: '10px 6px', fontWeight: 600 }}>{p.name} {p.id === match.activeBowlerId ? '•' : ''}</td>
                  <td style={{ textAlign: 'right', padding: '10px 6px' }}>{(p.ballsBowled / 6).toFixed(1)}</td>
                  <td style={{ textAlign: 'right', padding: '10px 6px' }}>{p.runsConceded}</td>
                  <td style={{ textAlign: 'right', padding: '10px 6px', fontWeight: 700, color: '#ef4444' }}>{p.wicketsTaken}</td>
                  <td style={{ textAlign: 'right', padding: '10px 6px', color: obsConfig.accentColor }}>{p.ballsBowled ? (p.runsConceded / (p.ballsBowled / 6)).toFixed(2) : '0.00'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (resolvedPlateMode === 'match-summary') {
      const isSecondInnings = match.currentInnings === 2 || match.innings1Total !== undefined;
      
      const team1 = isSecondInnings 
        ? (match.battingTeamId === 'team_a' ? match.teamB : match.teamA) 
        : match.teamA;
      const team2 = isSecondInnings 
        ? (match.battingTeamId === 'team_a' ? match.teamA : match.teamB) 
        : match.teamB;

      // Scores and overs
      const team1Score = isSecondInnings && match.innings1Total 
        ? `${match.innings1Total.runs}/${match.innings1Total.wickets}` 
        : `${match.runs}/${match.wickets}`;
      const team1Overs = isSecondInnings && match.innings1Total 
        ? match.innings1Total.oversStr 
        : overDisplay;
      const team1RR = isSecondInnings && match.innings1Total 
        ? (match.innings1Total.runs / (match.innings1Total.legalBalls / 6 || 1)).toFixed(2) 
        : crr;
      const team1Extras = ((isSecondInnings && match.innings1Total ? match.innings1Total.runs : match.runs) % 6) + 4;

      const team2Score = isSecondInnings 
        ? `${match.runs}/${match.wickets}` 
        : 'YET TO BAT';
      const team2Overs = isSecondInnings ? overDisplay : '0.0';
      const team2RR = isSecondInnings ? crr : '0.00';
      const team2Extras = isSecondInnings ? (match.runs % 5) + 3 : 0;

      // Performance calculations
      const team1TopBatters = [...team1.players].sort((a, b) => b.runsScored - a.runsScored).slice(0, 3);
      const team1TopBowlers = [...team2.players].filter(p => p.ballsBowled > 0).sort((a, b) => b.wicketsTaken - a.wicketsTaken || a.runsConceded - b.runsConceded).slice(0, 3);

      const team2TopBatters = isSecondInnings 
        ? [...team2.players].sort((a, b) => b.runsScored - a.runsScored).slice(0, 3) 
        : [];
      const team2TopBowlers = isSecondInnings 
        ? [...team1.players].filter(p => p.ballsBowled > 0).sort((a, b) => b.wicketsTaken - a.wicketsTaken || a.runsConceded - b.runsConceded).slice(0, 3) 
        : [];

      return (
          <div className="premium-plate-wrapper glow-card" style={{ ...themeStyle, width: '100%', maxWidth: '95vw', background: 'linear-gradient(135deg, #020b18 0%, #010408 100%)', borderRadius: 24, padding: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textTransform: 'uppercase', color: obsConfig.accentColor, fontWeight: 900, fontSize: '1.25rem', letterSpacing: '0.15em', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 10 }}>
            {obsConfig.tournamentName || 'INTERNATIONAL CRICKET'} • MATCH SUMMARY
          </div>

          {/* Team 1 Summary */}
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden' }}>
            {/* Header bar */}
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>{team1.name.toUpperCase()}</span>
              <div style={{ display: 'flex', gap: 16, fontSize: '0.82rem', color: '#94a3b8', fontWeight: 700 }}>
                <span>OVERS <strong style={{ color: '#fff' }}>{team1Overs}</strong></span>
                <span>RR <strong style={{ color: '#fff' }}>{team1RR}</strong></span>
                <span>EXTRAS <strong style={{ color: '#fff' }}>{team1Extras}</strong></span>
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: 950, color: obsConfig.accentColor }}>{team1Score}</span>
            </div>
            {/* Split Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              {/* Batters */}
              <div style={{ padding: '12px 16px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                {team1TopBatters.map((p, idx) => (
                  <div key={p.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: idx < 2 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                    <span style={{ color: '#cbd5e0', fontSize: '0.95rem', fontWeight: 600 }}>{p.name}</span>
                    <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', fontWeight: 900, padding: '2px 8px', borderRadius: 6, fontSize: '0.85rem' }}>
                      {p.runsScored} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>({p.ballsFaced})</span>
                    </span>
                  </div>
                ))}
              </div>
              {/* Bowlers */}
              <div style={{ padding: '12px 16px' }}>
                {team1TopBowlers.length > 0 ? team1TopBowlers.map((p, idx) => (
                  <div key={p.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: idx < 2 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                    <span style={{ color: '#cbd5e0', fontSize: '0.95rem', fontWeight: 600 }}>{p.name}</span>
                    <span style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#fb7185', fontWeight: 900, padding: '2px 8px', borderRadius: 6, fontSize: '0.85rem' }}>
                      {p.wicketsTaken}/{p.runsConceded} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>({(p.ballsBowled / 6).toFixed(1)})</span>
                    </span>
                  </div>
                )) : <div style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', paddingTop: 10 }}>No bowling stats yet</div>}
              </div>
            </div>
          </div>

          {/* Team 2 Summary */}
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden' }}>
            {/* Header bar */}
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>{team2.name.toUpperCase()}</span>
              {isSecondInnings ? (
                <div style={{ display: 'flex', gap: 16, fontSize: '0.82rem', color: '#94a3b8', fontWeight: 700 }}>
                  <span>OVERS <strong style={{ color: '#fff' }}>{team2Overs}</strong></span>
                  <span>RR <strong style={{ color: '#fff' }}>{team2RR}</strong></span>
                  <span>EXTRAS <strong style={{ color: '#fff' }}>{team2Extras}</strong></span>
                </div>
              ) : <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>YET TO BAT</span>}
              <span style={{ fontSize: '1.4rem', fontWeight: 950, color: isSecondInnings ? obsConfig.accentColor : '#64748b' }}>{team2Score}</span>
            </div>
            {/* Split Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              {/* Batters */}
              <div style={{ padding: '12px 16px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                {isSecondInnings && team2TopBatters.length > 0 ? team2TopBatters.map((p, idx) => (
                  <div key={p.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: idx < 2 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                    <span style={{ color: '#cbd5e0', fontSize: '0.95rem', fontWeight: 600 }}>{p.name}</span>
                    <span style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#fb7185', fontWeight: 900, padding: '2px 8px', borderRadius: 6, fontSize: '0.85rem' }}>
                      {p.runsScored} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>({p.ballsFaced})</span>
                    </span>
                  </div>
                )) : <div style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', paddingTop: 10 }}>Innings not started</div>}
              </div>
              {/* Bowlers */}
              <div style={{ padding: '12px 16px' }}>
                {isSecondInnings && team2TopBowlers.length > 0 ? team2TopBowlers.map((p, idx) => (
                  <div key={p.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: idx < 2 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                    <span style={{ color: '#cbd5e0', fontSize: '0.95rem', fontWeight: 600 }}>{p.name}</span>
                    <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', fontWeight: 900, padding: '2px 8px', borderRadius: 6, fontSize: '0.85rem' }}>
                      {p.wicketsTaken}/{p.runsConceded} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>({(p.ballsBowled / 6).toFixed(1)})</span>
                    </span>
                  </div>
                )) : <div style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', paddingTop: 10 }}>No bowling stats yet</div>}
              </div>
            </div>
          </div>

          {/* Win / Match Status Banner */}
          <div style={{ background: 'linear-gradient(90deg, #1e3a8a 0%, #020617 100%)', borderLeft: `6px solid ${obsConfig.accentColor}`, color: '#fff', fontWeight: 900, fontSize: '1.25rem', borderRadius: 12, padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textTransform: 'uppercase' }}>
            <span>{match.matchStatus}</span>
            <span style={{ color: obsConfig.accentColor, fontSize: '0.9rem', fontWeight: 800 }}>LIVE BROADCAST</span>
          </div>
        </div>
      );
    }

    if (resolvedPlateMode === 'winner') {
      const statusText = match.matchStatus || 'LIVE';
      let winnerName = 'CHAMPIONS';
      let statusSubtitle = 'MATCH IN PROGRESS';
      let isTbd = false;

      if (statusText.toLowerCase().includes('won by')) {
        const parts = statusText.split(/won by/i);
        winnerName = parts[0].trim().toUpperCase();
        statusSubtitle = `WON BY ${parts[1].trim().toUpperCase()}`;
      } else if (statusText.toLowerCase().includes('won')) {
        const parts = statusText.split(/won/i);
        winnerName = parts[0].trim().toUpperCase();
        statusSubtitle = 'VICTORY';
      } else {
        winnerName = match.runs > 0 ? batTeam.name.toUpperCase() : 'TBD';
        statusSubtitle = 'LEADING CHAMPIONSHIP';
        isTbd = (winnerName === 'TBD');
      }

      return (
        <div className="premium-plate-wrapper winner-celebration" style={{
          ...themeStyle,
          '--accent-color': obsConfig.accentColor,
          width: '100%',
          maxWidth: '95vw',
          borderRadius: 24,
          padding: '60px 40px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.9)',
          textAlign: 'center'
        } as React.CSSProperties}>
          <div className="celebration-sparkles" />
          {Array.from({ length: 45 }).map((_, idx) => (
            <div
              key={idx}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${Math.random() * 2 + 2}s`,
                backgroundColor: idx % 3 === 0 ? obsConfig.accentColor : idx % 3 === 1 ? '#00dfa2' : '#ffffff',
                transform: `scale(${Math.random() * 0.8 + 0.4})`
              }}
            />
          ))}
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', borderRadius: '50%', width: 140, height: 140, marginBottom: 10 }}>
            <div style={{ fontSize: '6rem', animation: 'bounce 1.2s infinite alternate', filter: `drop-shadow(0 0 15px ${obsConfig.accentColor})` }}>🏆</div>
          </div>
          <div style={{ fontSize: '1.25rem', color: obsConfig.accentColor, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', marginTop: 14, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8, display: 'inline-block', minWidth: '240px' }}>
            {obsConfig.tournamentName ? obsConfig.tournamentName.toUpperCase() : 'ICC CHAMPIONS TROPHY'}
          </div>

          {isTbd ? (
            <div style={{ margin: '30px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 20 }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{match.teamA.name}</div>
                <div style={{ background: obsConfig.accentColor, color: '#fff', borderRadius: '50%', width: 54, height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 900, boxShadow: `0 0 15px ${obsConfig.accentColor}` }}>VS</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{match.teamB.name}</div>
              </div>
              <div style={{ fontSize: '1.2rem', color: '#a0aec0', marginTop: 16, fontWeight: 600 }}>
                Live Score: {match.runs}/{match.wickets} ({overDisplay} Ov)
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '4.5rem', fontWeight: 950, color: '#fff', margin: '20px 0', textTransform: 'uppercase', letterSpacing: '-0.02em', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
              {winnerName}
            </div>
          )}

          <div style={{ fontSize: '1.25rem', color: obsConfig.accentColor, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', background: 'rgba(255,255,255,0.06)', border: `1px solid ${obsConfig.accentColor}`, display: 'inline-block', padding: '8px 24px', borderRadius: 999 }}>
            {statusSubtitle}
          </div>
        </div>
      );
    }

    if (resolvedPlateMode === 'custom-text') {
      return (
        <div className="premium-plate-wrapper glow-card" style={{ ...themeStyle, width: '100%', maxWidth: '95vw', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: 24, padding: '40px 30px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
          {resolvedLogoUrl && <img src={resolvedLogoUrl} alt="Logo" style={{ height: 60, marginBottom: 20, objectFit: 'contain' }} />}
          <div style={{ fontSize: '1.2rem', color: resolvedAccentColor, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em' }}>BROADCAST NOTICE</div>
          <div style={{ fontSize: '3.5rem', fontWeight: 950, color: '#fff', margin: '20px 0' }}>
            {resolvedCustomText || 'MATCH LIVE NOW'}
          </div>
        </div>
      );
    }

    const overlayStyle: React.CSSProperties = {
      opacity: obsConfig.opacity / 100,
      width: '100%',
      maxWidth: '92vw',
      pointerEvents: 'none',
      zIndex: 10,
    };

    const renderBaseLayout = () => {
      if (obsConfig.layout === 'sky-sports') {
      return (
        <div style={{ ...themeStyle, ...overlayStyle, display: 'flex', flexDirection: 'column', gap: 4, width: '100%', maxWidth: '95vw', margin: 'auto' }}>
          <div style={{ background: 'rgba(5, 15, 30, 0.95)', borderBottom: `3px solid ${obsConfig.accentColor}`, padding: '6px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '4px 4px 0 0', textTransform: 'uppercase', fontSize: '0.78rem', letterSpacing: '0.1em', fontWeight: 700 }}>
            <span style={{ color: '#ffc107', transition: 'all 0.5s ease' }}>{topLeftText}</span>
            <span style={{ color: '#cbd5e0', transition: 'all 0.5s ease' }}>{topCenterText}</span>
            <span style={{ color: '#fff', transition: 'all 0.5s ease' }}>{topRightText}</span>
          </div>
          <div style={{ background: '#0a101d', display: 'flex', alignItems: 'center', height: '52px', borderRadius: '0 0 4px 4px', overflow: 'hidden', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }}>
            <div style={{ background: obsConfig.accentColor, color: '#fff', padding: '0 18px', height: '100%', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 900, fontSize: '1.1rem' }}>
              {batTeam.flagUrl && <img src={batTeam.flagUrl} alt="" style={{ height: 26, width: 26, borderRadius: '50%', objectFit: 'cover', background: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} />}
              {batTeam.name}
            </div>
            <div style={{ color: '#fff', padding: '0 18px', fontWeight: 800, fontSize: '1.25rem', display: 'flex', alignItems: 'baseline', gap: 4 }}>
              {match.runs} <span style={{ fontSize: '0.9rem', opacity: 0.85 }}>/{match.wickets}</span>
              <span style={{ fontSize: '0.82rem', color: '#cbd5e0', marginLeft: 8 }}>({overDisplay} Ov)</span>
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0 15px', borderLeft: '1px solid rgba(255,255,255,0.1)', height: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  🏏 {activeStriker ? activeStriker.name : '—'}
                </div>
                <div style={{ color: obsConfig.accentColor, fontSize: '0.76rem', fontWeight: 800 }}>
                  {activeStriker ? `${activeStriker.runsScored} (${activeStriker.ballsFaced})` : '0 (0)'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
                <div style={{ color: '#cbd5e0', fontWeight: 600, fontSize: '0.85rem' }}>
                  {activeNonStriker ? activeNonStriker.name : '—'}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.76rem', fontWeight: 700 }}>
                  {activeNonStriker ? `${activeNonStriker.runsScored} (${activeNonStriker.ballsFaced})` : '0 (0)'}
                </div>
              </div>
            </div>
            <div style={{ background: '#172033', padding: '6px 16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', fontSize: '0.85rem', color: '#cbd5e0', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
              <span>B: <strong style={{ color: '#fff' }}>{activeBowler ? `${activeBowler.name}` : '—'}</strong> {activeBowler ? `${activeBowler.oversBowled}-${activeBowler.wicketsTaken}/${activeBowler.runsConceded}` : ''}</span>
              {renderBallHistoryRow('small')}
            </div>
          </div>
        </div>
      );
    }

    if (obsConfig.layout === 'banner') {
      return (
        <div 
          style={{ 
            ...themeStyle, 
            ...overlayStyle, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 4, 
            width: '100%', 
            maxWidth: '920px', 
            margin: 'auto',
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            animation: 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
        >
          {/* Top Bar */}
          <div style={{ 
            background: 'rgba(15, 23, 42, 0.95)', 
            borderBottom: `3px solid ${obsConfig.accentColor}`, 
            padding: '8px 20px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            borderRadius: '12px 12px 0 0', 
            textTransform: 'uppercase', 
            fontSize: '0.82rem', 
            letterSpacing: '0.12em', 
            fontWeight: 800,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <span style={{ color: obsConfig.accentColor, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.5s ease' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: obsConfig.accentColor, display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
              {topLeftText}
            </span>
            <span style={{ color: '#fff', transition: 'all 0.5s ease' }}>{topCenterText}</span>
            <span style={{ color: '#94a3b8', transition: 'all 0.5s ease' }}>{topRightText}</span>
          </div>

          {/* Bottom Main Bar */}
          <div style={{ 
            background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)', 
            display: 'flex', 
            alignItems: 'center', 
            height: '56px', 
            borderRadius: '0 0 12px 12px', 
            overflow: 'hidden', 
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderTop: 'none'
          }}>
            {/* Team Block */}
            <div style={{ 
              background: obsConfig.accentColor, 
              color: '#fff', 
              padding: '0 24px', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 10,
              fontWeight: 900, 
              fontSize: '1.2rem', 
              letterSpacing: '0.05em',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              boxShadow: 'inset -5px 0 15px rgba(0,0,0,0.1)'
            }}>
              {batTeam.flagUrl && <img src={batTeam.flagUrl} alt="" style={{ height: 30, width: 30, borderRadius: '50%', objectFit: 'cover', background: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} />}
              {batTeam.name}
            </div>

            {/* Score Block */}
            <div style={{ 
              color: '#fff', 
              padding: '0 24px', 
              fontWeight: 900, 
              fontSize: '1.4rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4,
              borderRight: '1px solid rgba(255,255,255,0.1)',
              height: '100%'
            }}>
              {match.runs}<span style={{ fontSize: '1rem', opacity: 0.8, fontWeight: 700 }}>/{match.wickets}</span>
              <span style={{ fontSize: '0.88rem', color: '#94a3b8', marginLeft: 8, fontWeight: 700 }}>({overDisplay} Ov)</span>
            </div>

            {/* Batsmen Details */}
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              justifyContent: 'space-around', 
              alignItems: 'center', 
              padding: '0 20px', 
              height: '100%'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  🏏 {activeStriker ? activeStriker.name : '—'}
                </div>
                <div style={{ color: obsConfig.accentColor, fontSize: '0.76rem', fontWeight: 800 }}>
                  {activeStriker ? `${activeStriker.runsScored} (${activeStriker.ballsFaced})` : '0 (0)'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
                <div style={{ color: '#cbd5e0', fontWeight: 600, fontSize: '0.85rem' }}>
                  {activeNonStriker ? activeNonStriker.name : '—'}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.76rem', fontWeight: 700 }}>
                  {activeNonStriker ? `${activeNonStriker.runsScored} (${activeNonStriker.ballsFaced})` : '0 (0)'}
                </div>
              </div>
            </div>

            {/* Bowler Details */}
            <div style={{ 
              background: 'rgba(15, 23, 42, 0.6)', 
              padding: '6px 20px', 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              fontSize: '0.9rem', 
              color: '#cbd5e0', 
              borderLeft: '1px solid rgba(255,255,255,0.1)' 
            }}>
              <span>B: <strong style={{ color: '#fff', fontWeight: 700 }}>{activeBowler ? `${activeBowler.name}` : '—'}</strong> {activeBowler ? `${activeBowler.oversBowled}-${activeBowler.wicketsTaken}/${activeBowler.runsConceded}` : ''}</span>
              {renderBallHistoryRow('small')}
            </div>
          </div>
        </div>
      );
    }

    if (obsConfig.layout === 'mini') {
      return (
        <div style={{ ...themeStyle, ...overlayStyle, display: 'inline-flex', alignItems: 'center', background: '#0a0f1d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', width: 'auto', margin: 'auto' }}>
          <div style={{ background: obsConfig.accentColor, color: '#fff', padding: '6px 12px', fontWeight: 900, fontSize: '0.9rem' }}>
            {batTeam.name.slice(0, 3)}
          </div>
          <div style={{ padding: '6px 14px', color: '#fff', fontSize: '1rem', fontWeight: 800 }}>
            {match.runs}/{match.wickets} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#a0aec0', marginLeft: 6 }}>({overDisplay})</span>
            {match.currentInnings === 2 && match.target && (
              <span style={{ color: '#fbbf24', marginLeft: 8, fontSize: '0.85rem', fontWeight: 800 }}>T: {match.target}</span>
            )}
          </div>
        </div>
      );
    }

    if (obsConfig.layout === 'l-band') {
      return (
        <div style={{ ...themeStyle, ...overlayStyle, display: 'flex', flexDirection: 'column', width: '300px', height: '100vh', background: 'rgba(10, 15, 30, 0.95)', borderRight: `4px solid ${obsConfig.accentColor}`, padding: 20, gap: 20, boxShadow: '8px 0 32px rgba(0,0,0,0.5)' }}>
          {obsConfig.logoUrl && <img src={obsConfig.logoUrl} alt="Logo" style={{ height: 50, objectFit: 'contain' }} />}
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: obsConfig.accentColor, fontWeight: 800 }}>{obsConfig.branding || 'CRICPULSE'} L-BAND</span>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff' }}>{batTeam.name}</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 950, color: obsConfig.accentColor }}>{match.runs}/{match.wickets}</div>
            <div style={{ fontSize: '1.2rem', color: '#fff' }}>{overDisplay} Overs</div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 15 }}>
            <span style={{ fontSize: '0.75rem', color: '#cbd5e0', display: 'block' }}>STRIKER</span>
            <strong style={{ fontSize: '1.1rem', color: '#fff' }}>{activeStriker ? `${activeStriker.name} ${activeStriker.runsScored}(${activeStriker.ballsFaced})*` : '—'}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#cbd5e0', display: 'block' }}>BOWLER</span>
            <strong style={{ fontSize: '1.1rem', color: '#fff' }}>{activeBowler ? activeBowler.name : '—'}</strong>
            {renderBallHistoryRow('small')}
          </div>
        </div>
      );
    }

    return (
      <div style={{ ...themeStyle, ...overlayStyle, display: 'flex', flexDirection: 'column', width: '380px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.4)', background: '#111827', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ background: `linear-gradient(90deg, ${obsConfig.accentColor} 0%, #111827 80%)`, padding: '6px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>
          <span>{obsConfig.branding || 'CRICPULSE'} OVERLAY</span>
          <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>{match.venue?.split(',')[0]}</span>
        </div>
        <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#fff' }}>
              {batTeam.name} <span style={{ color: obsConfig.accentColor }}>{match.runs}/{match.wickets}</span>
              {match.currentInnings === 2 && match.target && (
                <span style={{ fontSize: '0.9rem', color: '#fbbf24', marginLeft: 8, fontWeight: 700 }}>(T: {match.target})</span>
              )}
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: 2, color: '#a0aec0' }}>
              {activeStriker ? `${activeStriker.name} ${activeStriker.runsScored}(${activeStriker.ballsFaced})*` : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
              {overDisplay} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#9ca3af' }}>Ov</span>
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: 2, color: '#a0aec0' }}>
              {activeBowler ? `${activeBowler.name} ${activeBowler.oversBowled}-${activeBowler.wicketsTaken}/${activeBowler.runsConceded}` : ''}
            </div>
            {renderBallHistoryRow('small', 'right')}
          </div>
        </div>
        <div style={{ background: '#1f2937', padding: '6px 16px', fontSize: '0.76rem', display: 'flex', justifyContent: 'space-between', color: '#d1d5db', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span>PARTNERSHIP: <strong>{match.currentPartnership.runs} ({match.currentPartnership.balls})</strong></span>
          {match.target && <span style={{ color: '#fbbf24', fontWeight: 700 }}>REQ: {((match.target - match.runs) / Math.max((match.maxOvers * 6 - match.legalBalls) / 6, 0.1)).toFixed(2)} RPO</span>}
        </div>
      </div>
    );
  };

    const positioningWrapperStyle: React.CSSProperties = {
      position: 'absolute',
      bottom: '24px',
      left: '50%',
      transform: `translate(calc(-50% + ${obsConfig.horizontalOffset}px), ${obsConfig.verticalOffset}px)`,
      width: '100%',
      maxWidth: '92vw',
      pointerEvents: 'none',
      zIndex: 10,
      display: 'flex',
      justifyContent: 'center',
    };

    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
        {/* Scoreboard layer */}
        <div style={positioningWrapperStyle}>
          <div style={{
            animation: 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            width: '100%',
            display: 'flex',
            justifyContent: 'center'
          }}>
            {renderBaseLayout()}
          </div>
        </div>

        {/* Milestone layer */}
        {activeMilestone !== 'none' && renderActiveMilestone()}
      </div>
    );
  };

  const renderObsPanel = () => {
    if (!match) return null;

    const previewBackdropStyle: React.CSSProperties = {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '22px',
      width: '100%',
      aspectRatio: '16/9',
      border: '1px solid var(--border)',
      background: obsConfig.transparent
        ? 'transparent'
        : 'radial-gradient(circle at center, #1b263b 0%, #0d1b2a 100%)',
    };

    const copyOverlayLinkWithParams = async () => {
      const shareUrl = `${window.location.origin}${window.location.pathname}?isolated=true`;
      await navigator.clipboard.writeText(shareUrl);
      pushToast('Broadcast link copied to clipboard!', 'teal');
    };

    return (
      <div className="content-grid" style={{ gridTemplateColumns: '1fr 340px', gap: 20 }}>
        <section className="card" style={{ display: 'grid', gap: 16 }}>
          <p className="section-title">Live overlay preview (Admin Monitor)</p>
          <div style={previewBackdropStyle}>
            {renderOverlayGraphicDirect()}
          </div>
          <div className="control-row" style={{ marginTop: 14 }}>
            <button className="action-btn" onClick={copyOverlayLinkWithParams}>Copy Isolated Overlay Link</button>
          </div>
        </section>
        <aside className="card">
          <p className="section-title">Overlay Config Panel</p>
          <div className="form-grid" style={{ gap: 14 }}>
            <label>Branding name
              <input value={obsConfig.branding} onChange={(e) => handleUpdateObsConfig('branding', e.target.value)} />
            </label>
            <label>Tournament name
              <input value={obsConfig.tournamentName} onChange={(e) => handleUpdateObsConfig('tournamentName', e.target.value)} placeholder="ICC Champions Trophy" />
            </label>
            <label>Accent color
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="color" value={obsConfig.accentColor} onChange={(e) => handleUpdateObsConfig('accentColor', e.target.value)} style={{ width: 44, height: 40, border: 'none', borderRadius: 8, padding: 0, cursor: 'pointer' }} />
                <input value={obsConfig.accentColor} onChange={(e) => handleUpdateObsConfig('accentColor', e.target.value)} style={{ flex: 1 }} />
              </div>
            </label>
            <label>Font Family
              <select value={obsConfig.fontFamily} onChange={(e) => handleUpdateObsConfig('fontFamily', e.target.value)}>
                <option value="Space Grotesk">Space Grotesk</option>
                <option value="Inter">Inter</option>
                <option value="Teko">Teko</option>
                <option value="Outfit">Outfit</option>
                <option value="Segoe UI">Segoe UI</option>
              </select>
            </label>
            <label>Layout Style
              <select value={obsConfig.layout} onChange={(e) => handleUpdateObsConfig('layout', e.target.value)}>
                <option value="lower-third">Lower-third</option>
                <option value="banner">Banner</option>
                <option value="mini">Mini</option>
                <option value="sky-sports">Sky Sports</option>
                <option value="l-band">L-Band</option>
              </select>
            </label>
            <label>Top Info Bar Mode
              <select value={obsConfig.topBarInfoMode || 'auto'} onChange={(e) => handleUpdateObsConfig('topBarInfoMode', e.target.value)}>
                <option value="auto">Auto-Cycle Modes (6s)</option>
                <option value="chase">Target & Chase Equation</option>
                <option value="branding">Tournament & Branding</option>
                <option value="venue">Venue & Partnership</option>
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              Plate Mode (fullscreen)
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={obsConfig.plateMode} onChange={(e) => handleUpdateObsConfig('plateMode', e.target.value)} style={{ flex: 1 }}>
                  <option value="overlay">Normal Overlay Graphic</option>
                  <option value="vs">VS Splash Screen</option>
                  <option value="playing-xi">Playing XI Screen</option>
                  <option value="batting-card">Batting Scorecard Card</option>
                  <option value="bowling-card">Bowling Card</option>
                  <option value="match-summary">Match Summary Plate</option>
                  <option value="winner">Winner Celebrations</option>
                  <option value="custom-text">Custom Text Notice</option>
                </select>
                {obsConfig.plateMode !== 'overlay' && (
                  <button 
                    type="button"
                    onClick={() => handleUpdateObsConfig('plateMode', 'overlay')} 
                    style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '10px', padding: '0 14px', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Hide
                  </button>
                )}
              </div>
            </label>
            <label>Custom Notice Text
              <input value={obsConfig.customText} onChange={(e) => handleUpdateObsConfig('customText', e.target.value)} placeholder="RAIN DELAY" />
            </label>
            <label>Upload Logo Photo
              <input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    handleUpdateObsConfig('logoUrl', reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }} style={{ border: 'none', background: 'transparent', padding: 0 }} />
            </label>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '10px 0', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '0.92rem', color: 'var(--muted)', fontWeight: 600 }}>Transparent Backdrop</span>
              <div style={{ position: 'relative', width: 48, height: 26, background: obsConfig.transparent ? obsConfig.accentColor : '#cbd5e0', borderRadius: 15, transition: 'background-color 0.2s ease', display: 'inline-block' }}>
                <input type="checkbox" checked={obsConfig.transparent} onChange={(e) => handleUpdateObsConfig('transparent', e.target.checked)} style={{ opacity: 0, width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 2, cursor: 'pointer', margin: 0 }} />
                <div style={{ position: 'absolute', top: 3, left: obsConfig.transparent ? 25 : 3, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: 'left 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
              </div>
            </div>
          </div>
        </aside>
      </div>
    );
  };

  const renderHistoryView = () => {
    return (
      <div className="content-grid">
        <section className="card" style={{ gridColumn: '1 / -1' }}>
          <p className="section-title">Match History & Archives</p>
          <p className="muted">Review all completed and archived match scorecards below.</p>
        </section>
        {historyMatches.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <p className="muted" style={{ textAlign: 'center', padding: '40px 0' }}>No archived matches found. Create or complete a match and click "Archive Match" from the Scorer console.</p>
          </div>
        ) : (
          historyMatches.map((m, index) => {
            const matchOverDisplay = `${Math.floor(m.legalBalls / 6)}.${m.legalBalls % 6}`;
            const batTeam = m.battingTeamId === 'team_a' ? m.teamA : m.teamB;
            const bowlTeam = m.bowlingTeamId === 'team_a' ? m.teamA : m.teamB;

            const topBatter = [...(batTeam.players || [])].sort((a, b) => b.runsScored - a.runsScored)[0];
            const topBowler = [...(bowlTeam.players || [])].sort((a, b) => b.wicketsTaken - a.wicketsTaken)[0];

            let resultText = m.resultText || "";
            if (!resultText && m.target) {
              if (m.runs >= m.target) {
                resultText = `${batTeam.name} won by ${10 - m.wickets} wickets`;
              } else {
                resultText = `${bowlTeam.name} won by ${m.target - 1 - m.runs} runs`;
              }
            } else if (!resultText) {
              resultText = `${batTeam.name} scored ${m.runs}/${m.wickets}`;
            }

            return (
              <div key={m.id || index} className="card" style={{ gridColumn: '1 / -1', borderLeft: '4px solid var(--teal)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 12 }}>
                  <div>
                    <strong style={{ fontSize: '1.1rem' }}>{m.teamA.name} vs {m.teamB.name}</strong>
                    <div className="muted">{m.venue || 'Unknown Venue'}</div>
                  </div>
                  <span className="badge highlight">{m.matchStatus.toUpperCase()}</span>
                </div>

                <div className="score-hero" style={{ padding: '8px 0' }}>
                  <div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                      {m.runs}/{m.wickets} <span style={{ fontSize: '1rem', fontWeight: 400 }} className="muted">({matchOverDisplay} ov)</span>
                    </div>
                    <div className="muted" style={{ fontWeight: 600, color: 'var(--teal)', marginTop: 4 }}>
                      {resultText}
                    </div>
                  </div>
                  {m.innings1Total && (
                    <div style={{ textAlign: 'right' }}>
                      <div className="muted">1st Innings:</div>
                      <strong>{m.innings1Total.runs}/{m.innings1Total.wickets} ({m.innings1Total.oversStr} ov)</strong>
                    </div>
                  )}
                </div>

                <div className="score-grid" style={{ marginTop: 14 }}>
                  {topBatter && topBatter.runsScored > 0 && (
                    <div className="stat-box">
                      <span className="stat-label">Top Batter</span>
                      <div className="stat-value" style={{ fontSize: '1.05rem' }}>{topBatter.name}</div>
                      <span className="muted">{topBatter.runsScored} runs ({topBatter.ballsFaced}b)</span>
                    </div>
                  )}
                  {topBowler && topBowler.ballsBowled > 0 && (
                    <div className="stat-box">
                      <span className="stat-label">Top Bowler</span>
                      <div className="stat-value" style={{ fontSize: '1.05rem' }}>{topBowler.name}</div>
                      <span className="muted">{topBowler.wicketsTaken} wkts ({topBowler.runsConceded} runs)</span>
                    </div>
                  )}
                  <div className="stat-box">
                    <span className="stat-label">Match ID</span>
                    <div className="stat-value" style={{ fontSize: '0.9rem', opacity: 0.7 }}>{m.id?.slice(0, 8) || 'match_' + index}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const isIsolated = params.get('isolated') === 'true';

  if (isIsolated) {
    return (
      <>
        <style>{`html, body, #root { background: transparent !important; background-color: transparent !important; margin: 0; padding: 0; overflow: hidden; }`}</style>
        <div style={{ background: 'transparent', height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden', boxSizing: 'border-box' }}>
          {renderOverlayGraphicDirect()}
        </div>
      </>
    );
  }

  return (
    <div className={`app-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`} style={isSidebarCollapsed ? { gridTemplateColumns: '1fr' } : undefined}>
      {isMobileMenuOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`} style={isSidebarCollapsed ? { display: 'none' } : undefined}>
        <div className="brand">
          <div className="brand-badge">CP</div>
          <div>CRICPULSE</div>
          <button className="menu-close-btn" onClick={() => setIsMobileMenuOpen(false)}>×</button>
        </div>
        <div className="nav-list">
          {[
            ['fan', 'Fan Center'],
            ['admin', 'Admin Desk'],
            ['tournament', 'Tournament Dashboard'],
            ['obs', 'OBS Overlay'],
            ['setup', 'Setup Wizard'],
            ['history', 'Match History'],
            ['settings', 'Settings'],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`nav-button ${view === key ? 'active' : ''}`}
              onClick={() => {
                switchView(key as View);
                setIsMobileMenuOpen(false);
              }}
            >
              <span>{label}</span>
            </button>
          ))}
        </div>
        <div className="sidebar-footer">
          <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.8 }}>Live broadcast</div>
          <div style={{ fontWeight: 700, marginTop: 8 }}>{match?.venue || 'Mumbai'}</div>
          <div className="muted" style={{ marginTop: 6 }}>{match?.commentaryState || 'Setup ready'}</div>
        </div>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <div className="control-row" style={{ alignItems: 'center' }}>
            <button
              className="menu-toggle-btn"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setIsMobileMenuOpen(true);
                } else {
                  setIsSidebarCollapsed(!isSidebarCollapsed);
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 12px',
                borderRadius: '12px',
                border: '1.5px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--navy)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--shadow-1)',
                marginRight: 6
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--navy)';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = 'var(--navy)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--surface-2)';
                e.currentTarget.style.color = 'var(--navy)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <button
              className="ghost-btn"
              onClick={() => (viewHistory.length ? switchView(viewHistory[viewHistory.length - 1], true) : switchView('fan'))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 16px',
                borderRadius: '12px',
                border: '1.5px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--navy)',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: 'var(--shadow-1)',
                marginRight: 6
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--navy)';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = 'var(--navy)';
                e.currentTarget.style.transform = 'translateX(-2px)';
                const svg = e.currentTarget.querySelector('svg');
                if (svg) svg.style.transform = 'translateX(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--surface-2)';
                e.currentTarget.style.color = 'var(--navy)';
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'none';
                const svg = e.currentTarget.querySelector('svg');
                if (svg) svg.style.transform = 'none';
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: 6, transition: 'transform 0.2s ease' }}
              >
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back
            </button>
            <div>
              <strong>{view === 'fan' ? 'Fan Center' : view === 'admin' ? 'Admin Desk' : view === 'tournament' ? 'Tournament Dashboard' : view === 'obs' ? 'OBS Overlay' : view === 'setup' ? 'Setup Wizard' : view === 'history' ? 'Match History' : 'Settings'}</strong>
              <div className="muted">CP • CRICPULSE</div>
            </div>
          </div>
          <div className="status-pill">
            <span className={`live-dot ${connection === 'offline' ? 'offline' : ''}`} />
            {connection === 'live' ? 'LIVE SYNCED' : 'OFFLINE'}
          </div>
        </header>
        {loading ? <div className="card"><div className="skeleton skeleton-lg" /><div className="skeleton" style={{ marginTop: 12, width: '60%' }} /></div> : null}
        {!loading && view === 'fan' ? renderFanCenter() : null}
        {!loading && view === 'admin' ? renderAdminDesk() : null}
        {!loading && view === 'tournament' ? renderTournamentDashboard() : null}
        {!loading && view === 'obs' ? renderObsPanel() : null}
        {!loading && view === 'setup' ? renderSetupWizard() : null}
        {!loading && view === 'history' ? renderHistoryView() : null}
        {!loading && view === 'settings' ? renderSettingsView() : null}
        <footer className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <div className="muted">© 2026 CricPulse Scorecast Engine • Enterprise Grade</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/zenvor_logo.jpg" alt="Zenvor Tech Logo" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', fontWeight: 800 }}>Created By</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--navy)' }}>Zenvor Tech</span>
            </div>
          </div>
        </footer>
      </main>
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.variant}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export default App;
