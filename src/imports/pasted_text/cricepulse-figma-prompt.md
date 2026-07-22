# CricPulse — Figma UI/UX Generation Prompt (Light Theme)

Paste this into Figma (First Draft / Make / AI prompt field) or use it as your own design brief. Content is taken directly from the CricPulse documentation — no invented copy, no added or removed sections.

---

**Project Brief**
Design a premium, **light-mode**, broadcast-studio-grade UI/UX for **CricPulse**, an enterprise-grade real-time adaptive cricket scoring board, live stats engine and broadcast overlay system, built by **Zenvor Tech** (product line "Zenvor Engine"). It has 5 connected screens sharing one live match state, used by different roles simultaneously (scorer, fans, OBS operator, camera operator, admin). The UI must feel clean, crisp, and professional — a bright, high-clarity control-room aesthetic rather than dark broadcast neon — while remaining fully functional operational software, not decorative. Every label, section, and button listed below must appear exactly as written; do not invent new copy, remove sections, or change terminology.

**Brand identity**
- Product name: **CRICPULSE**, logo mark "CP" (square, lime-filled badge, black text)
- Subline under logo: **ZENVOR ENGINE**
- Footer line: "© 2026 CricPulse Scorecast Engine • Enterprise Grade"
- Footer badge: "Created by Zenvor Tech"
- Live sync indicator (top right, always visible): pulsing dot + "LIVE SYNCED" ("LIVE" on small screens) when connected, red dot + "OFFLINE" ("OFF") when not

---

**Design System — Light Theme**

Color palette:
- Base background: off-white, e.g. `#F7F7F5`
- Header / footer surface: pure white `#FFFFFF` with a thin bottom border/shadow
- Panel / card surfaces: white `#FFFFFF` or very light gray `#F2F2F0`, `#EDEDEB`, `#F5F5F3`, with soft drop shadows instead of dark glow
- Primary accent (lime — brand color, unchanged): `#C3F400` for fills/highlights; use a deeper lime `#7CB000` / `#588C00` for text-on-white, links, and active states where contrast is needed
- Text primary: near-black `#1A1A1A`
- Text muted: gray-500–600 range
- Danger / wicket: red-600 (unchanged)
- Boundary highlight (4s/6s): lime fill, black text (unchanged — still works on light)
- Extras — Wide: pink, No Ball: amber, Bye: blue, Leg Bye: purple (keep as soft tinted chips, light backgrounds with saturated text, suited to a white canvas)

Typography (unchanged):
- Display / Headings: Space Grotesk, bold–black weights, uppercase, wide tracking
- Body / UI: Inter
- Stats / numeric / mono labels: JetBrains Mono

Surface treatment (adapted for light):
- Cards: white surfaces with soft, low-opacity gray shadows and 1px light-gray borders (replacing the old glass/blur + dark-glow treatment)
- Corner accents: subtle soft lime radial tint in card corners (much lower opacity than dark mode) for depth without heaviness
- Live pulse: animated lime glow ring on live status dots
- Ball-sequence pills: rounded tokens, color-coded per event type, on light backgrounds with clear borders for definition

Iconography: Lucide icon set, functional use only — Activity, Award, Tv, Settings, Camera, ArrowLeft/Right, AlertTriangle, Sparkles, Check, Copy, Search, TrendingUp, Flame, Users, Play.

---

**Information Architecture**
```
CricPulse
├── Global Header (persistent)
│   ├── Back navigation
│   ├── Brand lockup (CP mark + CRICPULSE + ZENVOR ENGINE)
│   ├── Primary nav (4 tabs)
│   └── Live sync status indicator
├── Match Setup Wizard
│   ├── Step 1 — Team Name & Squads Formation
│   ├── Step 2 — Pitch Toss & Match Metrics
│   └── Step 3 — Pre-Match Certificate / Confirmation
├── Admin Desk (Scorer Console)
├── Fan Center
├── OBS Overlay
├── Settings
└── Camera Broadcaster (mobile-first, separate route)
```
Navigation model: tab-based, with a custom back-navigation history stack (not literal browser back) — falls back to intelligent defaults per tab when history is empty (Settings→Scorer, Camera→Overlay, Overlay→Fan, Fan→Scorer).

---

**Global Components**

Sticky header: back button + "CP" logo + "CRICPULSE" + "ZENVOR ENGINE" (left) — pill tab bar: Admin Desk / Fan Center / OBS Overlay / Settings, active tab filled lime, inactive ghost gray (center) — live sync chip (right).

Milestone toast banner: slides in below header on FOUR / SIX / WICKET / OVER events, colored tag + message + "DISMISS [X]".

Footer: "© 2026 CricPulse Scorecast Engine • Enterprise Grade" + "Created by Zenvor Tech" badge.

Wicket capture modal: header "DISMISS BATSMAN DETAIL" + subcopy "CALCULATING CIS PENALTY"; fields — Wicket Type (Bowled/Caught/LBW/Stumped/Run Out), Batsman Dismissed (Striker/On Deck), Fielder Involved (optional, placeholder "e.g. Wade, Cummins"); actions Cancel / Confirm OUT (red, primary).

---

**Screen 1 — Match Setup Wizard**
3-step linear flow, numbered step-bubble indicator, progress badge "STEP {n} OF 3".
- Step 1 "Team Name & Squads Formation": Team A/B name inputs (Home/Away), Playing XI (11 fields per team), Substitutes/Extras (4 fields per team, purple accent)
- Step 2 "Pitch Toss & Match Metrics": toss winner toggle cards, toss decision (Bat First/Bowl First), innings to activate (Innings 1 – Set High Score / Innings 2 – Active Target Chase), max overs quick-select (5/10/20/50)
- Step 3 "Pre-Match Certificate": read-only summary + primary CTA to launch
Interaction notes: step bubbles clickable for non-linear jump; Step 2 has "◀ Back to Squads"; name inputs auto-uppercase.

**Screen 2 — Admin Desk (Scorer Console)**
1. Scoreboard hero: status pill, team vs team headline, score/overs, conditional chase banner "NEED {X} RUNS IN {Y} BALLS", striker card (emphasized) + non-striker card (dimmed), active bowler card, over-sequence ball pills
2. Live controls: extras sub-tabs (Wide/No Ball/Bye/Leg Bye), run quick actions, wicket trigger, bowler select + quick-add bowler, manual striker/non-striker override
3. Match detail panels: Over Timeline, Partnership Stand
Empty states explicitly shown: "NO ACTIVE STRIKER", "NO NON-STRIKER"

**Screen 3 — Fan Center**
1. Hero scoreboard card: overlapping team flag avatars, status/venue tags, "{Team A} vs {Team B}" headline, toss summary, large score + overs, right-side Chase Requirement (or Current Run Rate), "Created by Zenvor Tech" badge
2. AI Commentary panel: "CricPulse Predictor AI commentary"
3. Scorecards: Batting table, Bowling table (overs/wickets/economy)
4. Target Equation widget: ON/OFF toggle, live chase equation, RRR/CRR tiles, fallback copy when target unset
5. Win Probability Engine: percentage + momentum bar chart

**Screen 4 — OBS Overlay**
Preview mode (in-app rendering) and Pure overlay mode (transparent, chrome-free for OBS capture via URL hash).
Layout variants: lower-third, banner, mini, sky-sports.
Config panel "OBS Studio One-Click Broadcast Link": 1. Select source design style, 2. Brand accent color theme (lime/cyan/crimson/gold/magenta), 3. Accent scale limit, 4. Card background opacity, 5. Horizontal align offset, 6. Vertical align offset, 7. Broadcast font branding (Inter/JetBrains Mono/Space Grotesk), 8. Calibration safe-area guides toggle, 9. Copy calibrated broadcast hyperlink (generated URL + copy confirmation state).

**Screen 5 — Camera Broadcaster**
Stream identity input (placeholder "e.g. cricpulse-cam-1"), copy Production Stream URL, facing-mode toggle, resolution selector (360p/480p/720p/1080p), connection status + sub-status, mic level meter, framing grid toggle, connected callers count.
Related producer surface — Live Production Screen: "Live Ingestion Router", "Video Mixed Monitoring", "Broadcast Score Tickers", empty state "Scorecast Unavailable".

**Screen 6 — Settings**
Panel "Match Rules & Toss Options": innings overs cap, toss winner team select, toss decision select, active playing innings select.
Actions: "Reload Default Mock Scores" (secondary, pink outline) / "Apply & Reset Scoreboard" (primary, lime filled).

---

**Interaction & State Behavior**
- Real-time sync via SSE with automatic REST-polling fallback (1.5s interval); live/offline reflected in header
- Deep-linking via URL hash (`#pure-overlay`, `#overlay`, `#camera`, `#admin`/`#stream`)
- Milestone toasts auto-trigger on four/six/wicket/over events
- Context-aware back navigation via custom history stack

**Responsive Behavior**
- Admin Desk: desktop/tablet-first
- Fan Center: mobile-first, then desktop
- OBS Overlay: desktop-first
- Camera Broadcaster: mobile-first
- Settings: desktop-first, then mobile
- Nav tab bar collapses to icon + abbreviated status on small viewports

**Accessibility Notes**
- All color-coded ball events carry a text label alongside color (never color-only)
- Live/offline states shown with both color and text
- Numeric/stat content in monospace for scan-reading

**UX Requirement**
Build this as a working, navigable prototype — wire the 4 main nav tabs + camera route, the wizard's 3 steps, the wicket modal open/close, and the OBS ON/OFF + layout-variant toggles — not static screens. Maintain full information density; do not simplify away any listed label, stat, or control for visual cleanliness. Adapt the dark-mode motifs (glow, glass, neon) into light-appropriate equivalents (soft shadow, tinted accents, crisp borders) without losing the brand's confident, broadcast-grade feel.