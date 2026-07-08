# Design: Materials, Email Certificates, Pass %, and Approval Flow

Date: 2026-07-08
Status: Approved design — pending implementation plan

## Overview

Four related changes to the Symbiosys Learning & Assessment Portal:

1. Add **Sakana AI** and **GLM 5.2** to the learning materials (auto-generated slides + document view).
2. **Email the certificate as a PDF attachment** via Resend.
3. Change the single-course quiz **pass percentage from 80% to 70%**.
4. **Remove admin approval for single course certificates** (auto-issue on pass); keep admin approval only for the **consolidated (module) certificate**.

Features 2 and 4 are coupled: removing single-cert approval changes when and how emails fire. This design inverts today's behaviour — currently single certs are emailed a link on admin approval and module certs are delivered in-app with no email.

## Current-state facts (verified in code)

- **Materials are procedurally generated.** `src/lib/materials.js:generateMaterial()` builds the document (`intro`, `concepts`, `examples`, `bestPractices`, `summary`) and the `slides[]` array from a single catalog entry. `getMaterial()` and `getQuizForResource()` read the live catalog (`allResources()`), so adding a catalog entry yields a document view, a slides view, a quiz, and a certificate with no component changes. `spineFor()` routes `ai-tools` to the AI concept spine.
- **Pass % has one JS source of truth.** `src/lib/quizFromMaterial.js` exports `PASS_PERCENT = 80`, re-exported by `quizStore.js` and `certificates.js` and consumed by every page. It is duplicated as a hardcoded `80` in `api/approve-certificate.js` and in `supabase/schema.sql` (trigger + `get_public_certificate` RPC + backfill).
- **Module pass % is already 70%** (`src/lib/workshops.js:MODULE_PASS_PERCENT = 70`). Untouched by this work.
- **Module certs share `quiz_attempts`.** A module (consolidated) certificate is a sentinel row whose `resource_name` is `module-cert:<slug>` (`workshops.js`). Any auto-approve rule MUST exclude these rows.
- **Today's approval flow.** Single cert: student "requests" (`cert_status='pending'`), admin calls `approveCertificate()` → `POST /api/approve-certificate` → sets `approved`, mints a 24h `cert_tokens` row, emails a **download link**. Module cert: student requests, admin approves via a direct `quiz_attempts.update({cert_status})` in `AdminLeaderboard.jsx` — **no email**, in-app download only.
- **PDF generation is client-side.** `certificates.js:downloadCertificatePDF()` / `downloadModuleCertificatePDF()` use `jsPDF` + `qrcode`, load `/signature.jpg` and `/logo.jpg` via a browser `Image`/canvas helper, and call `doc.save()`.
- **Dual backend.** Every data path branches on `isSupabaseConfigured`; the offline mock (`mockStore.js`) mirrors the SQL tables. All changes must preserve mock parity.

## Feature 1 — Add Sakana AI and GLM 5.2

**Change:** append two entries to the `ai-tools` `items[]` array in `src/data/database.js`.

Each entry: `{ name, description, url, badges: ["NEW"], tags: ["AI Tools"] }`. Optional `popupDetails` omitted (auto-generated per the chosen scope). The `description` is the primary seed for the generated material, so it must be substantive.

Draft copy (user may refine before implementation):

- **Sakana AI** — "A Tokyo-based AI research lab applying nature-inspired methods — evolution, collective intelligence, and model merging — to build efficient foundation models and automate scientific discovery (e.g. 'The AI Scientist' and evolutionary model-merge techniques)." `url: https://sakana.ai/`
- **GLM 5.2** — "An open frontier large language model in Zhipu AI's GLM family, tuned for strong reasoning, coding, and agentic tool-use with long-context support." `url: https://z.ai/`

**Blast radius:** none beyond data — quizzes, materials, certificates, and search pick these up via `allResources()`.

## Feature 3 — Pass percentage 80% → 70%

Change the value in four places (module stays 70%):

1. `src/lib/quizFromMaterial.js`: `PASS_PERCENT = 80 → 70` (propagates through `quizStore`, `certificates`, and all pages/copy).
2. `api/approve-certificate.js`: `PASS_PERCENT = 80 → 70`.
3. `api/issue-certificate.js` (new file): use `70`.
4. `supabase/schema.sql`: trigger `>= 80 → >= 70`; `get_public_certificate` `>= 80 → >= 70`; backfill `where … percentage >= 70`.
5. `supabase/migration.sql`: add an idempotent block applying the trigger + RPC change to already-provisioned databases.

## Features 4 + 2 — Auto-issue + email single certs; keep approval + email for consolidated certs

### Target state

| | Trigger | Approval | Email (PDF attached) | In-app download |
|---|---|---|---|---|
| Single course cert | pass ≥70% | none (auto) | automatic, immediately | immediately |
| Consolidated / module cert | complete module at ≥70% | admin (unchanged) | on admin approval | after approval |

### Server (`/api`)

- **`api/_assets.js`** (new): the two certificate images (`signature.jpg`, `logo.jpg`) base64-inlined as string constants, so serverless functions have them without depending on the CDN-served `/public` folder. *(Decision: embed as base64.)*
- **`api/_certificate-pdf.js`** (new, shared): ports `downloadCertificatePDF` and `downloadModuleCertificatePDF` to Node using `jsPDF` + `qrcode`. Replaces the browser image loader with base64 constants from `_assets.js`. Returns a `Buffer` (`doc.output('arraybuffer')`) for Resend attachment.
- **`api/issue-certificate.js`** (new): authenticated **student self-serve**. Body `{ attemptId }`. Resolves the caller from the `Authorization: Bearer` token, asserts `attempt.user_id === caller.id` and `percentage >= 70` and the row is **not** a module sentinel, sets `cert_status='approved'`, generates the single-cert PDF, mints a 24h `cert_tokens` row, and emails the PDF (attachment) plus a secondary dashboard/download link. *(Decision: keep the link as secondary.)*
- **`api/approve-certificate.js`** (changed): remains **admin-gated**, now the **module-cert** path. Attaches the module-cert PDF to the email in addition to the link.

### Schema

Update `set_quiz_attempt_cert_id()` so that, for **non-module** rows passing at ≥70%, it also sets `cert_status='approved'` (in addition to `cert_id`). Module rows (`resource_name like 'module-cert:%'`) keep their explicit status (`pending` on request). This makes single-cert issuance DB-authoritative and independent of the client. Apply via `schema.sql` and `migration.sql`.

### Client

- `src/features/dashboard/pages/QuizRunner.jsx` — `submit()`: insert a single passing attempt with `cert_status: 'approved'` (mock parity; Supabase also enforces via trigger). After insert, best-effort call `issueCertificate(attempt)` to send the email. Never block the results screen on the email.
- `src/lib/certificateApi.js` — add `issueCertificate(attempt)` (calls `/api/issue-certificate`; mock mode: local approve + local token, no email). Route module approval through the PDF-attaching `approve-certificate`.
- `src/features/dashboard/pages/CertificatePage.jsx` / `CertificatesPage.jsx` — single certs show **Download** immediately; remove the single-cert "request approval / pending" UI. Keep the module-cert request/pending/approved UI.
- `src/features/admin/pages/AdminLeaderboard.jsx` / `AdminStudentProfile.jsx` — remove single-cert approval controls (no longer needed). Keep module-cert approval; approval now emails the PDF.

### Mock / offline parity

No server: single certs auto-approve locally (client sets `cert_status='approved'`), in-app download works via existing client-side `downloadCertificatePDF`, email is skipped (as today). Module approval stays a local status update.

## Risks / implementation notes

- **RLS on `cert_status`.** Confirm the `quiz_attempts` insert/update policy allows a student to write `cert_status='approved'` on their own row (today students already set `'pending'`). If restricted, rely on the DB trigger to set it and have the client tolerate the server value.
- **`jsPDF` + `qrcode` in Node serverless.** Both are isomorphic; verify they import cleanly in the Vercel Node runtime and watch bundle size. The image loader must be replaced (no `Image`/canvas server-side).
- **Layout parity.** The ported server PDF must match the client PDF pixel layout (A4 landscape, footer coordinates in `certificates.js`). Keep the two in sync or extract shared layout constants.
- **No test coverage exists** anywhere in the repo (codegraph confirms). Verification will be manual/functional per change.

## Out of scope

- Custom/bespoke material authoring for Sakana/GLM (auto-generated only).
- Server-side rendering of certificate images beyond the two existing assets.
- Changing module (consolidated) pass percentage (already 70%).
- Any refactor of the resource override/merge engine.
