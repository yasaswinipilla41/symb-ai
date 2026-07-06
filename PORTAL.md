# AI Tools Portal — Learning & Assessment Platform

This project extends the original **Symbiosys AI Knowledge Base** into a full
Learning & Assessment Portal, **without removing any existing functionality**.
The original catalog (search, categories, resource popups, visit buttons, theme
toggle) is fully preserved and now lives at the `/explore` route.

## Stack

Kept the existing stack (no migration): **Vite + React 18 + JSX + plain CSS**.
Added: `react-router-dom`, `@supabase/supabase-js`, `lucide-react`.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build
```

## Backend: Supabase-ready with an offline mock

Everything talks to a single adapter (`src/lib/backend.js`). With **no config**
it runs on a **localStorage mock** — auth, profiles, bookmarks, history,
quizzes, feedback, notifications all work offline for development/demo.

To go live with real Supabase (no code changes):

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor (tables +
   RLS + auto-profile trigger).
3. Copy `.env.example` → `.env` and set:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
4. Restart `npm run dev`. The app auto-detects the keys and switches over.

### Creating the first admin

- **Mock mode:** set `VITE_ADMIN_BOOTSTRAP_EMAIL=you@company.com` in `.env`;
  the account with that email is created as an admin on registration.
- **Supabase mode:** register normally, then run:
  ```sql
  update public.profiles set role = 'admin' where email = 'you@company.com';
  ```

## Routes

| Route              | Access        | Description                                   |
|--------------------|---------------|-----------------------------------------------|
| `/`                | public        | Cover / landing page                          |
| `/home`            | public        | Home hub (featured, categories, popular, …)   |
| `/explore`         | public        | **Original Knowledge Base** (preserved)       |
| `/login` `/register` `/forgot-password` | public | Authentication            |
| `/dashboard/*`     | user + admin  | User dashboard (overview, bookmarks, history, profile, settings, feedback) |
| `/admin/*`         | admin only    | Admin console (overview, users, analytics, feedback, notifications) |

Route guards live in `src/routes/ProtectedRoute.jsx`.

## What's built (Phase 1)

- ✅ Cover page, Home page, professional footer, responsive + dark mode
- ✅ Secure auth (login/register/logout/forgot-password/session/roles/protected routes)
- ✅ User dashboard: overview w/ live stats, bookmarks, activity history, profile, settings, feedback
- ✅ Admin console: stat cards, user management (roles/ban/activate/delete), analytics charts, feedback review, broadcast notifications
- ✅ Full Supabase schema + RLS for every required table
- ✅ Activity/history tracking wired into browsing & auth

## Phase 2 — Quiz module (done)

- ✅ **Every tool has a 20-question quiz**, generated deterministically from the
  catalog (`src/lib/quiz.js`): 10 MCQ (plausible distractors drawn from other
  tools/categories), 5 True/False, 5 open-ended (2 marks each). Same tool → same
  quiz, so scores are comparable. Admin-curated questions can override later.
- ✅ **Runner** (`QuizRunner.jsx`): per-question navigation, live timer, **instant
  MCQ/True-False validation**, open-ended autosave, progress bar.
- ✅ **Results**: total score, percentage (on the 15 objective marks), correct/
  wrong counts, time taken, completion status — **persisted permanently** to
  `quiz_attempts`, plus a history entry.
- ✅ **My Results** page: full attempt history with expandable open-ended answers
  and per-answer grading status.
- ✅ **Admin → Quiz Review**: grade open-ended answers (0/1/2 marks); saving
  recomputes the combined score & percentage across all 25 marks.

## Certificates — approval + emailed 24h download link

- ✅ Passing a quiz (≥ `PASS_PERCENT`, 80%) earns a certificate; the user
  **requests** it (`cert_status: 'pending'`).
- ✅ An admin **approves** it from the Leaderboard or a Student Profile. Approval
  goes through the serverless function [`api/approve-certificate.js`](api/approve-certificate.js),
  which: verifies the caller is an admin, sets `cert_status: 'approved'`, mints a
  random token in `public.cert_tokens` with a **24-hour `expires_at`**, and
  **emails the user a download link** via Resend.
- ✅ The emailed link opens the public page `/certificate-download/:token`
  ([CertificateDownloadPage.jsx](src/features/public/CertificateDownloadPage.jsx)),
  which validates the token server-side via
  [`api/redeem-cert-token.js`](api/redeem-cert-token.js) and, if valid & unexpired,
  renders the certificate and lets the user download the PDF (same jsPDF generator
  as the in-app pages). Expired/invalid links show a friendly message.
- ✅ **Offline/demo mock mode** works with no server: approval updates the local
  store, mints a local token, and returns the link on-screen instead of emailing.

### Deploying the certificate email flow (Supabase + Vercel)

1. Run [`supabase/certificate-download-tokens.sql`](supabase/certificate-download-tokens.sql)
   in the Supabase SQL editor (also included at the bottom of `schema.sql`).
2. In the **Vercel dashboard → Project → Settings → Environment Variables**, add
   (these are server-only — **no** `VITE_` prefix):
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase → Settings → API → `service_role` (secret)
   - `RESEND_API_KEY` — from Resend (required to actually send email)
   - `EMAIL_FROM` — e.g. `Symbiosys Technologies <certificates@symbiosystech.com>`
     (the sending domain must be verified in Resend)
   - `PUBLIC_BASE_URL` — e.g. `https://symbiosys-ai-pi.vercel.app`
3. Redeploy. Until `RESEND_API_KEY`/`EMAIL_FROM` are set, approval still works and
   the admin is shown the 24h link to share manually.

## Next phases (scaffolded, marked "Next phase" in the UI)

- Editable in-portal PPT/PDF learning materials (open/edit/save/download)
- Full resource & category management (add/edit/delete/upload/feature/publish)
- Site settings (logo, name, contact, footer, social links)

Tables for all of the above already exist in `supabase/schema.sql`
(`quiz_questions`, `quiz_attempts`, `materials`, `resources`, `categories`,
`downloads`), so the next phases are additive.

## Project layout

```
src/
  lib/           backend adapter, supabase client, mock store, auth + theme context, catalog, icons
  routes/        ProtectedRoute / AdminRoute guards
  components/
    portal/      marketing header/footer, resource preview card
    dashboard/   shared dashboard shell + charts
    (Header, Sidebar, ResourceGrid, ResourceCard, Modal — ORIGINAL, untouched)
  features/
    landing/     CoverPage
    home/        HomePage
    explore/     KnowledgeBase (original app, relocated)
    auth/        Login / Register / ForgotPassword
    dashboard/   UserDashboard + pages
    admin/       AdminDashboard + pages
  data/database.js   ORIGINAL catalog (untouched)
supabase/schema.sql  full DB schema + RLS
```
