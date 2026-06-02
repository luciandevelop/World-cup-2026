# World Cup Arena — Firebase real login + Firestore checklist

## Ce schimbă Firebase

Cu variabilele `VITE_FIREBASE_*` completate, aplicația trece automat din Demo/localStorage în mod real:

- Google Login folosește Firebase Authentication.
- Profilurile se salvează în `users/{uid}`.
- Predicțiile se salvează în `predictions/{uid_matchId}`.
- Rezultatele admin se salvează în `matchResults/{matchId}`.
- Clasamentul citește aceleași rezultate și predicții pentru toți utilizatorii.

Dacă variabilele lipsesc, aplicația rămâne în Demo Mode și salvează local pe telefon/browser.

## Pașii exacți în Firebase

1. Firebase Console → Add project.
2. Build → Authentication → Get started.
3. Sign-in method → Google → Enable.
4. Build → Firestore Database → Create database.
5. Project settings → General → Your apps → Web app.
6. Copiază valorile configului în Vercel → Project → Settings → Environment Variables.

## Variabile Vercel necesare

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_ADMIN_EMAILS=luciavram87@gmail.com
```

După ce le adaugi în Vercel: Redeploy.

## Reguli Firestore pentru test privat

Pentru test cu prieteni, poți folosi temporar regulile astea. Nu sunt reguli finale pentru producție publică.

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }

    match /predictions/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    match /matchResults/{matchId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## Test după deploy

1. Intră cu Google pe telefonul tău.
2. Pune o predicție.
3. Refresh.
4. Predicția trebuie să rămână.
5. Intră de pe alt telefon cu alt cont Google.
6. Pune altă predicție.
7. Admin marchează meciul Final.
8. Ambele conturi trebuie să apară în clasament.
