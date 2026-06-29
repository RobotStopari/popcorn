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

## Cloudinary setup (event & blog images)

Used for optional cover photos and event galleries uploaded from admin:

| Preset env var | Preset name (example) | Folder (example) | Use |
|---|---|---|---|
| `VITE_CLOUDINARY_PRESET_COVER` | `popcorn_event_cover` | `popcorn/events/covers` | Titulní fotka akce — karta akce |
| `VITE_CLOUDINARY_PRESET_PROMO` | `popcorn_event_pr` | `popcorn/events/pr` | Propagační materiály (max 10) — galerie u nadcházející akce |
| `VITE_CLOUDINARY_PRESET_GALLERY` | `popcorn_event_gallery` | `popcorn/events/gallery` | Výběr z galerie (max 10) — galerie u proběhlé akce |
| `VITE_CLOUDINARY_PRESET_POST` | `popcorn_post_cover` | `popcorn/posts/covers` | Titulní fotka blogového příspěvku — karta + stránka článku |
| `VITE_CLOUDINARY_PRESET_POST_GALLERY` | `popcorn_post_gallery` | `popcorn/posts/gallery` | Galerie fotek (max 10) — konec příspěvku nad komentáři |
| `VITE_CLOUDINARY_PRESET_SITE_LOGO` | `popcorn_site_logo` | `popcorn/site/logo` | Logo webu — navigace, patička, admin |

Uploads are **stored on Cloudinary already optimized** (WebP, size limits in preset). Unsigned uploads cannot send transform params from the browser — set **Incoming transformation** on each preset’s **Transform** tab.

**Important:** Logo preset must use `c_limit` only — never `c_fill` or fixed height — or tall logos get cropped.

### 1. Create a free account

1. Go to [cloudinary.com](https://cloudinary.com/) and sign up (free tier is enough).
2. After login, open the **Dashboard**.
3. Note your **Cloud name** (e.g. `dxyz123abc`) — you will need it for `.env.local`.

### 2. Create four unsigned upload presets

For each preset: Cloudinary Console → **Settings** → **Upload** → **Upload presets** → **Add upload preset**.

**General (all presets):**

- **Signing mode:** **Unsigned**
- **Allowed formats:** JPG, PNG, WebP, GIF
- **Max file size:** 10 MB

**Preset 1 — cover (`popcorn_event_cover`):**

- **Asset folder:** e.g. `popcorn/events/covers`
- **Transform → Incoming transformation:**

  ```
  c_fill,g_center,w_840,h_560,f_webp,q_auto
  ```

  Center crop 3:2, 840×560 px, WebP.

**Preset 2 — promo (`popcorn_event_pr`):**

- **Asset folder:** e.g. `popcorn/events/pr`
- **Transform → Incoming transformation:**

  ```
  c_limit,w_1200,f_webp,q_auto
  ```

  Keeps aspect ratio, max width 1200 px, WebP.

**Preset 3 — gallery picks (`popcorn_event_gallery`):**

- **Asset folder:** e.g. `popcorn/events/gallery`
- **Transform → Incoming transformation:**

  ```
  c_limit,w_1600,f_webp,q_auto
  ```

  Keeps aspect ratio, max width 1600 px, WebP.

**Preset 4 — blog post cover (`popcorn_post_cover`):**

- **Asset folder:** e.g. `popcorn/posts/covers`
- **Transform → Incoming transformation:**

  ```
  c_fill,g_center,w_1440,h_416,f_webp,q_auto
  ```

  Center crop ~3.5:1, 1440×416 px, WebP (matches post page banner at 2× retina).

**Preset 5 — blog post gallery (`popcorn_post_gallery`):**

- **Asset folder:** e.g. `popcorn/posts/gallery`
- **Transform → Incoming transformation:**

  ```
  c_limit,w_1600,f_webp,q_auto
  ```

  Keeps aspect ratio, max width 1600 px, WebP (same rules as event gallery picks).

**Preset 6 — site logo (`popcorn_site_logo`):**

- **Preset name:** `popcorn_site_logo` (must match `VITE_CLOUDINARY_PRESET_SITE_LOGO`)
- **Asset folder:** e.g. `popcorn/site/logo`
- **Transform → Incoming transformation:**

  ```
  c_limit,w_800,f_webp,q_auto
  ```

  Keeps full aspect ratio (portrait logos OK), max width 800 px, WebP. **Do not** use `c_fill`, `c_crop`, or a fixed `h_` — that crops the logo.

Save each preset.

### 3. Add environment variables

In `.env.local` (and Cloudflare Pages → **Environment variables** for production):

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_PRESET_COVER=popcorn_event_cover
VITE_CLOUDINARY_PRESET_PROMO=popcorn_event_pr
VITE_CLOUDINARY_PRESET_GALLERY=popcorn_event_gallery
VITE_CLOUDINARY_PRESET_POST=popcorn_post_cover
VITE_CLOUDINARY_PRESET_POST_GALLERY=popcorn_post_gallery
VITE_CLOUDINARY_PRESET_SITE_LOGO=popcorn_site_logo
```

(`VITE_CLOUDINARY_UPLOAD_PRESET` still works as a fallback for the cover preset only.)

Restart `npm run dev` after changing `.env.local`.

### 4. Deploy Firestore rules (image fields on events)

If you use share-link editing, redeploy rules after pulling this change:

```bash
firebase deploy --only firestore:rules
```

### 5. Test

1. Admin → **Akce** → create or edit an event.
2. Tab **Základní** → **Titulní fotka** / **Propagační materiály** → upload images.
3. Tab **Po akci** → **Galerie** → odkaz + **Výběr z galerie**.
4. Save — upcoming event page shows promo in gallery row; past event page shows picks + “Všechny fotky z akce” button.
5. Admin or blog page → create/edit post → **Titulní fotka** → upload; card and post page show the photo.
6. Blog post form → **Galerie fotek** → upload up to 10 images; they appear above comments on the post page.

**Security note:** Unsigned presets are public by design. Restrict abuse in Cloudinary → **Settings** → **Security** (allowed domains, upload preset folder/format limits). Never put `API Secret` in frontend code.

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
   - **Framework preset:** Vite (or None)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Deploy command:** `npm run deploy` (required — uploads pre-built `dist/` via Wrangler; does **not** use the Cloudflare Vite plugin)
   - **Node.js version:** 20 (`NODE_VERSION` = `20`)
4. **Environment variables** (Production and Preview) — add all `VITE_FIREBASE_*` variables from `.env.example` with your Firebase values, plus `VITE_CLOUDINARY_*` if you use event cover uploads.
5. Save and deploy.

SPA routing is handled by `wrangler.jsonc` (`not_found_handling: single-page-application`). Do **not** add a `public/_redirects` file — it conflicts with Workers deploy and causes an infinite-loop error.

#### If deploy fails with `registerHooks` / `@cloudflare/vite-plugin`

Wrangler tried to auto-add the Cloudflare Vite plugin (needs Node 22+). This repo already includes **`wrangler.jsonc`** for static assets only — make sure it is pushed to GitHub.

Cloudflare settings must be:

| Field | Value |
|--------|--------|
| Build command | `npm run build` |
| Deploy command | `npm run deploy` |
| Output directory | `dist` |

Do **not** let Wrangler rewrite `vite.config.js` or add `@cloudflare/vite-plugin` during deploy.

### 3. After first deploy

Add the Cloudflare Pages URL to Firebase **Authorized domains** so Google sign-in works on production.

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Dev server (port 5173)   |
| `npm run build`| Production build → `dist`|
| `npm run preview` | Preview production build |
