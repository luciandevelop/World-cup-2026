# ⚽ WC Predictions — v0.2-alpha

World Cup 2026 prediction challenge app.
Dark premium mobile-first React app.

---

## Stack

- **React 18** + **Vite 5** (zero config)
- **Vercel** for hosting (free tier)
- **Supabase** for auth + DB (free tier — not wired yet)
- No other dependencies

---

## Run locally

```bash
# 1. Enter project folder
cd wc-predictions

# 2. Install dependencies (only React + Vite)
npm install

# 3. Start dev server
npm run dev
# → Opens at http://localhost:5173
```

---

## Build for production

```bash
npm run build
# → Output in /dist folder

npm run preview
# → Preview production build locally at http://localhost:4173
```

---

## Deploy to Vercel

### Option A — Vercel CLI (fastest)

```bash
npm install -g vercel
vercel
# Follow prompts — framework: Vite, output: dist
```

### Option B — GitHub + Vercel dashboard

1. Push to GitHub:
```bash
git init
git add .
git commit -m "initial"
git remote add origin https://github.com/YOUR_USER/wc-predictions.git
git push -u origin main
```

2. Go to https://vercel.com → New Project → Import from GitHub
3. Framework: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy → live in ~30 seconds

---

## Environment variables (for production with Supabase)

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

| Variable | Where to get it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |

Add these same variables in Vercel dashboard under **Project → Settings → Environment Variables**.

---

## Project structure

```
wc-predictions/
├── index.html              # HTML entry, fonts, viewport
├── vite.config.js          # Vite config
├── package.json
├── vercel.json             # SPA routing (rewrites to index.html)
├── .env.example            # Env var template
└── src/
    ├── main.jsx            # React DOM render
    ├── App.jsx             # Root: auth stage, tab bar, modal
    ├── lib/
    │   ├── data.js         # Fixtures, scoring, engines (pure JS, no React)
    │   └── styles.js       # Global CSS keyframes + reset
    ├── components/
    │   ├── UI.jsx          # ScoreInput, StepInput, PossessionInput, GoogleLogo
    │   └── PredictionModal.jsx
    └── screens/
        ├── AuthScreens.jsx     # LoginScreen + NicknameScreen
        ├── MatchesScreen.jsx   # Full matches tab (LiveFeed, NextMatchHero, etc.)
        ├── LeaderboardScreen.jsx
        ├── AdminScreen.jsx
        └── HowToPlayScreen.jsx
```

---

## What works now (demo mode)

- Google login (simulated — always logs in as "Radu Popescu")
- Nickname selection with availability check
- All 42 real World Cup fixtures (Groups A/C/H/I/J/K/L)
- Prediction modal (score, possession drag, corners stepper)
- Lock timing (30 min before kickoff)
- Community picks percentage
- Leaderboard with identity rings, form badges, rivalry pressure
- Live Feed (demo events)
- Rules screen
- Admin panel (tap avatar 5x)
- Perfect Hit overlay

## What needs Supabase to work in production

1. Real Google OAuth (replace simulated login in `AuthScreens.jsx`)
2. Persisted predictions (replace `useState` in `App.jsx`)
3. Real leaderboard (replace demo friends in `LeaderboardScreen.jsx`)
4. Live feed events (replace `LIVE_FEED_EVENTS` in `data.js`)
5. Admin result entry saving (replace console.log in `AdminScreen.jsx`)
6. Match lock status per user
