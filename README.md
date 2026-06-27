# Komunita Popcorn

Public website for Komunita Popcorn — React + Vite SPA with Firebase (Auth, Firestore).

## Local development

```bash
npm install
cp .env.example .env.local
# Fill .env.local with Firebase web app config from Firebase Console
npm run dev
```

Firebase config lives in `.env.local` only. Never commit that file.

## Firebase setup

1. [Firebase Console](https://console.firebase.google.com/) → your project → **Project settings** → **Your apps** → Web app config.
2. Copy values into `.env.local` (see `.env.example` for variable names).
3. **Authentication** → enable Google sign-in.
4. **Authentication** → **Settings** → **Authorized domains** — add your production domain (e.g. `your-project.pages.dev` and custom domain).
5. Deploy Firestore rules when they change:

```bash
firebase deploy --only firestore:rules
```

> Firebase web API keys are public in the built frontend bundle. Restrict the key in [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (HTTP referrers / authorized domains) and rely on Firestore security rules for data access.

## Deploy to Cloudflare Pages (GitHub)

### 1. Push this repo to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create komunita-popcorn --public --source=. --push
```

Or create an empty repo on GitHub and:

```bash
git remote add origin git@github.com:YOUR_USER/komunita-popcorn.git
git push -u origin main
```

### 2. Connect Cloudflare Pages

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Select the GitHub repository.
3. Build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node.js version:** 20 (Environment variables → add `NODE_VERSION` = `20` if needed)
4. **Environment variables** (Production and Preview) — add all `VITE_FIREBASE_*` variables from `.env.example` with your Firebase values.
5. Save and deploy.

SPA routing is handled by `public/_redirects` (`/* → /index.html`).

### 3. After first deploy

Add the Cloudflare Pages URL to Firebase **Authorized domains** so Google sign-in works on production.

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Dev server (port 5173)   |
| `npm run build`| Production build → `dist`|
| `npm run preview` | Preview production build |
