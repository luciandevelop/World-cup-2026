# World Cup Arena 2026 — Firebase Setup Guide

## Overview

With `VITE_FIREBASE_*` environment variables set, the app automatically switches from
**Demo Mode** (localStorage) to **Live Mode** (real Firebase Auth + Firestore).

| Feature            | Demo Mode         | Live Mode              |
|--------------------|-------------------|------------------------|
| Login              | Local OTP (shown in UI) | Real Firebase Auth    |
| Predictions        | localStorage      | Firestore `predictions/` |
| Leaderboard        | Single device     | All users, real-time   |
| Admin results      | localStorage      | Firestore `results/`   |
| Session persistence| localStorage      | Firebase Auth + localStorage cache |

---

## Step 1 — Create Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. **Add project** → name it (e.g. `world-cup-arena-2026`)
3. Disable Google Analytics if not needed → **Create project**

---

## Step 2 — Enable Authentication

1. Left sidebar → **Build → Authentication → Get started**
2. **Sign-in method** tab:
   - **Email/Password** → Enable → **Save**
   - **Google** → Enable → set support email → **Save**
3. **Authorized domains** tab → add your Vercel domain (e.g. `worldcup-arena.vercel.app`)

---

## Step 3 — Create Firestore Database

1. Left sidebar → **Build → Firestore Database → Create database**
2. Choose **Start in production mode** (we'll add rules next)
3. Select region closest to your users (e.g. `europe-west1`)
4. **Enable**

---

## Step 4 — Apply Firestore Security Rules

Paste the contents of `firestore.rules` into:
**Firebase Console → Firestore → Rules tab → Edit rules → Publish**

Or deploy with Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

---

## Step 5 — Get Config Values

1. **Project settings** (gear icon) → **General** tab
2. Scroll to **Your apps** → click **Web** icon (`</>`) if no web app exists
3. Register app → copy the config object:

```js
const firebaseConfig = {
  apiKey:            "AIza...",
  authDomain:        "your-project.firebaseapp.com",
  projectId:         "your-project",
  storageBucket:     "your-project.firebasestorage.app",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123"
};
```

---

## Step 6 — Add Environment Variables

### Local Development
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### Vercel Deployment
1. Vercel dashboard → your project → **Settings → Environment Variables**
2. Add each variable:

| Variable | Value |
|----------|-------|
| `VITE_FIREBASE_API_KEY` | `AIza...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `your-project` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `your-project.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789` |
| `VITE_FIREBASE_APP_ID` | `1:123456789:web:abc123` |
| `VITE_ADMIN_EMAILS` | `your@email.com` |

3. **Deployments → Redeploy** (env vars require a new build)

---

## Step 7 — Test

1. Open app → login with Google → verify profile saves
2. Put a prediction → refresh → prediction must persist
3. Login from a second device/browser → see the same leaderboard
4. Admin: mark a match as finished → both users see score updates

---

## Email OTP Flow (Current Implementation)

The app uses a custom OTP system built on top of Firebase Auth:

1. **Send code**: `emailAuth.sendEmailCode(email)` writes a 6-digit code to
   Firestore `otpCodes/{emailDocId}` with a 10-minute TTL.

2. **Verify code**: `emailAuth.verifyEmailCode(email, code)` validates against
   Firestore, then calls `Firebase Auth createUserWithEmailAndPassword` (first time)
   or `signInWithEmailAndPassword` (returning user). The auto-generated password
   is stored in `emailPasswords/{emailDocId}` so the same account works on any device.

3. **Current state**: The 6-digit code is still shown in the UI (same as demo mode)
   because no Cloud Function sends the actual email yet.

### To send real emails (production):

Option A — Firebase Cloud Functions + SendGrid:
```js
// functions/index.js
exports.sendOTPEmail = functions.firestore
  .document('otpCodes/{docId}')
  .onWrite(async (change, context) => {
    const { email, code } = change.after.data();
    if (!code) return; // invalidated
    await sendgrid.send({
      to: email,
      subject: 'World Cup Arena — codul tău',
      text: `Codul tău de autentificare: ${code}\nExpiră în 10 minute.`,
    });
  });
```

Option B — Any SMTP/email API in a Vercel serverless function:
```js
// api/send-otp.js (Vercel)
export default async function handler(req, res) {
  const { email, code } = req.body;
  // send email via Resend / Mailgun / AWS SES
}
```

---

## Firestore Collections Reference

```
users/{uid}
  uid, email, nickname, nicknameLower, avatarId, isAdmin,
  createdAt (Timestamp), updatedAt (Timestamp)

predictions/{uid}_{matchId}
  uid, matchId (Number), scoreA, scoreB, possession, corners,
  createdAt (Timestamp), updatedAt (Timestamp)

results/{matchId}
  matchId (Number), homeScore, awayScore,
  homePossession, awayPossession, homeCorners, awayCorners,
  liveStatus ('pending'|'live'|'finished'), updatedAt, updatedBy

otpCodes/{emailDocId}
  email, code, expiresAt (ms), attempts

emailPasswords/{emailDocId}
  password, createdAt
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "Firebase: Error (auth/unauthorized-domain)" | Add your domain to Firebase Auth → Authorized domains |
| "Missing or insufficient permissions" | Check Firestore rules — are you signed in? |
| Predictions don't sync | Check browser console for Firestore errors |
| Google popup blocked | Test on HTTPS (not HTTP localhost) |
| Demo mode after adding env vars | Redeploy on Vercel; `.env.local` needs `VITE_` prefix |
