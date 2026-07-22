# CricPulse — Figma UI/UX Generation Prompt

Paste this into Figma (First Draft / Make / AI prompt field) or use it as your own design brief.
It contains ONLY real content pulled from the CricPulse codebase — no invented copy, no added features.

---

## 1. PROJECT BRIEF

Design a **premium, dark-mode, broadcast-studio-grade** UI/UX for **CricPulse**, an enterprise-grade real-time
adaptive cricket scoring board, live stats engine and broadcast overlay system, built by **Zenvor Tech**
(product line: "Zenvor Engine"). The product has 5 connected screens sharing one live match state. It must feel
like professional sports-broadcast software (think Sky Sports / Hawk-Eye control rooms) — high-contrast dark UI,
neon accent, glassmorphism panels, confident mono/display typography for stats — while remaining a genuinely
usable, functional working UI (not just decorative). Every label, button, and section below must appear in the
design exactly as written; do not invent new copy, do not remove sections, do not change terminology.

**Brand identity**
- Product name: **CRICPULSE**, logo mark "CP" (square, lime background, black text)
- Subline under logo: **ZENVOR ENGINE**
- Footer line: "© 2026 CricPulse Scorecast Engine • Enterprise Grade"
- Footer badge: "Created by Zenvor Tech"
- Live sync indicator (top right, always visible): pulsing dot + "LIVE SYNCED" (or short "LIVE") when connected,
  red dot + "OFFLINE" ("OFF") when not.

## 2. DESIGN SYSTEM (use exactly)

**Color palette**
- Background base: `#131314`
- Header / footer surface: `#0b0e14`
- Card / panel surfaces: `#0d0f14`, `#0c0d10`, `#111011`, `#111216`, `#1c1b1c`
- Primary accent (lime, "the CricPulse green"): `#c3f400`, dim variant `#abd600`
- Text primary: `#e5e2e2` / white
- Text muted: grays (gray-400 to gray-600)
- Wicket / danger red: red-600, rose-600 (`#e11d48`)
- Boundary highlight (4s/6s): lime background, black bold text
- Extras color coding: **wide** = pink, **no ball** = amber, **bye** = blue, **leg bye** = purple
- Glass panels: translucent dark (`rgba(11,14,20,0.85)`) with backdrop blur + 1px white/10% border

**Typography**
- Display / headings: **Space Grotesk** (bold/black weights, uppercase, wide tracking)
- Body / UI: **Inter**
- Stats, numbers, tickers, code-like labels: **JetBrains Mono**
- Section eyebrows are small, uppercase, letter-spaced mono labels in lime

**Signature UI motifs**
- Pulsing neon glow on "live" indicators (box-shadow glow animation in lime)
- Rounded pill "ball" tokens (dot for no run, colored fill for boundary/wicket/extras) shown in a horizontal
  over-sequence strip
- Soft blurred lime glow mesh in corners of hero cards (decorative depth)
- Step-indicator numbered bubbles for the wizard
- Sticky top header with back button, brand, center nav pill-tabs, live status on the right

## 3. GLOBAL NAVIGATION (persistent header)

- Left: back arrow button ("Go Back to last view") + CP logo + "CRICPULSE" / "ZENVOR ENGINE"
- Center: rounded pill tab bar with 4 tabs (icon + label each):
  - **Admin Desk** (activity icon)
  - **Fan Center** (award icon)
  - **OBS Overlay** (tv icon)
  - **Settings** (gear icon)
- Right: Live sync status chip
- Below header (conditional): a milestone toast banner — colored tag ("FOUR" / "SIX" / "WICKET" / "OVER") +
  message + "DISMISS [X]" button, slides down over the content

There is also a 5th, separately-routed screen: **Camera Broadcaster** (camera icon), a mobile-first node for
ground camera operators.

## 4. SCREEN 1 — MATCH SETUP WIZARD (first-run / reconfigure flow, 3 steps)

Header: badge "STEP {n} OF 3" + title "🏆 Live Match & Toss Setup Wizard" + 3 numbered step bubbles.

**Step 1 — "1. TEAM NAME & SQUADS FORMATION"**
Subtext: "Define your custom team name labels, the core playing 11, and the 4 benchmark substitutes (extras)."
Two side-by-side team cards (Team A "HOME", Team B "AWAY"):
- Label "TEAM A LABEL (HOME)" / "TEAM B LABEL (AWAY)" — text input, e.g. placeholder "INDIA" / "TITANS"
- "Playing XI Starter Lineup (11 Players)" — 11 numbered name inputs
- "Substitutes/Extras (4 Players)" — 4 name inputs, labeled X1–X4, styled in purple accent

**Step 2 — "2. PITCH TOSS & MATCH METRICS"**
Subtext: "Determine the toss outcomes and declare the batting/bowling roles on the field."
- "Who won the Toss?" — two large toggle buttons: "🏏 {Team A}" / "🛡️ {Team B}"
- "Toss Winner Decided to..." — "🔥 BAT FIRST" (amber) / "🏃‍♂️ BOWL FIRST" (indigo)
- "Innings to Activate" — "Innings 1 (Set High Score)" (sky) / "Innings 2 (Active Target Chase)" (rose)
- "Maximum Game Overs" — quick-select buttons: 5 / 10 / 20 / 50 OVERS
- Footer nav: "◀ Back to Squads" button + forward action

**Step 3 — Confirmation**
Card titled "PRE-MATCH CERTIFICATE" summarizing the setup, with a primary lime CTA button (sparkle icon) to
launch the match.

## 5. SCREEN 2 — ADMIN DESK / SCORER CONSOLE (main working screen, post-setup)

**Top scoreboard hero card**
- Status pill (e.g. "LIVE INNINGS 1" / target chase tag)
- Team vs Team headline, big score "{runs}/{wickets}", overs counter
- Conditional rose chase banner: "NEED {X} RUNS IN {Y} BALLS"
- Striker card (name, pulsing live dot, runs (balls), 4s/6s) and Non-striker card (dimmed)
- Active Bowler card: name, "{wickets}-{runsConceded}", overs
- "OVER SEQUENCE" — row of round ball-result pills, color-coded per the system above

**Live scoring control panel**
- Section "LIVE CONTROLS" with a lime action shortcut
- Extras sub-tabs: Wide / No Ball / Bye / Leg Bye
- Quick run entry buttons, wicket trigger button
- "Select Bowler ({bowling team})" dropdown
- "Quick Add Bowler to {bowling team}" — name input + add button
- Manual striker/non-striker override controls
- "OVER TIMELINE" panel — chronological list of overs/balls
- "PARTNERSHIP STAND" panel — current partnership runs/balls, batsmen pair

**Modal — Wicket capture** ("DISMISS BATSMAN DETAIL", subcopy "CALCULATING CIS PENALTY")
- "Wicket Type" select: Bowled / Caught / LBW / Stumped / Run Out
- "Batsman Dismissed" select (Striker / On Deck)
- "Fielder Involved (Optional)" text input, placeholder "e.g. Wade, Cummins"
- Buttons: "Cancel" / "Confirm OUT" (red)

## 6. SCREEN 3 — FAN CENTER (public bento-grid match center)

**Hero scoreboard card**
- Overlapping circular team flag avatars
- Status tag ("LIVE INNINGS 1" / "ACTIVE CHASE") + venue tag "{Stadium} Stadium"
- Headline "{Team A} vs {Team B}"
- Subtext: "Toss won by **{team}** • chose to **{bat/bowl}**"
- Giant center score block: eyebrow "CURRENT SCORECAST", huge "{runs}/{wickets}", "Overs: {x} / {max}"
- Right block: either "CHASE REQUIREMENT" (Needs X runs off Y balls, RRR/CRR) or "CURRENT RUN RATIO" (CRR value,
  "Innings 1 Finished: {runs}/{wkts} ({overs} ov)")
- "Created by Zenvor Tech" pill badge

**AI Commentary panel**
- Title: "CricPulse Predictor AI commentary" (sparkle icon, animated)

**Scorecards**
- Batting scorecard table
- Bowling scorecard table (Overs, Wickets, Economy columns)

**"🎯 TARGET EQUATION" widget**
- Toggle button: "🖥️ SCOREBOARD: ON" / "🖥️ SCOREBOARD: OFF"
- "LIVE CHASE EQUATION" — "NEED {X} RUNS" / "off {Y} balls remaining"
- Two stat tiles: "REQ RATE (RRR)" and "CURR RATE (CRR)"
- Fallback state: "Innings 1 in progress. Match target is not set yet." + "Target Set: {value/None}"

**"Win Probability Engine" panel**
- Big percentage value
- "Innings Momentum Graph (Impact metrics)" — vertical bar chart, key spikes highlighted in lime

## 7. SCREEN 4 — OBS OVERLAY (broadcast graphics + control panel)

**Live overlay preview (transparent lower-third HUD)** — matches the scoreboard hero styling: batting team +
score/overs box, chase banner, striker/non-striker readout, active bowler + over-sequence pills. Also supports
alternate compact/footer layout with a target footer bar.

**Control panel — "OBS STUDIO ONE-CLICK BROADCAST LINK"**
Numbered configuration steps:
1. SELECT SOURCE DESIGN STYLE
2. BRAND ACCENT COLOR THEME (lime / cyan / crimson / gold / magenta)
3. ACCENT SCALE LIMIT
4. CARD BG OPACITY
5. HORIZONTAL ALIGN OFFSET
6. VERTICAL ALIGN OFFSET
7. BROADCAST FONT BRANDING (Inter / JetBrains Mono / Space Grotesk)
8. CALIBRATION SAFE-AREA GUIDES (toggle)
9. COPY CALIBRATED BROADCAST HYPERLINK — generated URL + copy button

Layout mode variants to represent: **lower-third**, **banner**, **mini**, **sky-sports**.

## 8. SCREEN 5 — CAMERA BROADCASTER (mobile ground-camera node)

- Title with camera icon
- Stream name input, placeholder "e.g. cricpulse-cam-1", helper: "Give a unique name to this ground camera"
- Copy "Production Stream URL" action
- Facing mode toggle (front/back), resolution select (360p / 480p / 720p / 1080p)
- Live status + sub-status text (peer-to-peer connection state)
- Mic level meter (audio input visualization)
- Framing grid overlay toggle
- Connected callers/viewers count

(Related producer-side view, **Live Production Screen**, monitors incoming feeds: "Live Ingestion Router",
"Video Mixed Monitoring", "Broadcast Score Tickers", with an empty state "Scorecast Unavailable" when no match
is active.)

## 9. SCREEN 6 — SETTINGS

Card: "🏆 Match Rules & Toss Options"
- "Innings Overs Cap" (number input)
- "Toss Winner Team" select (Team A / Team B, shows actual names)
- "Toss Decision Choice" select (Bat First / Bowl First)
- "Active Playing Innings" select (First Innings (Set target) / Second Innings (Chasing target))
- Actions: "Reload Default Mock Scores" (secondary, pink outline) / "Apply & Reset Scoreboard" (primary lime)

## 10. UX REQUIREMENTS

- This must be a **working, navigable prototype**, not static mockups: wire the 4 main nav tabs + camera route
  with real click-through connections, wire the wizard's 3 steps sequentially, wire modal open/close states for
  the wicket capture dialog, and wire the OBS toggle states (SCOREBOARD ON/OFF, layout variant switch).
- Design at desktop width first (this is control-room / operator software), then adapt Fan Center and the
  wizard for mobile/tablet since fans and camera operators use phones.
- Keep information density high but scannable — this is real-time operational software; every stat, label and
  button listed above must be present and legible, not simplified away for "cleanliness."
- Use motion sparingly and purposefully: pulsing live dots, milestone toast slide-in, subtle glow — never
  decorative animation that delays reading a live score.