# Materials, Email Certificates, 70% Pass & Auto-Issue — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Sakana AI & GLM 5.2 to the learning catalog, lower the course pass mark to 70%, auto-issue single course certificates on pass (no admin approval) and email them as PDF attachments via Resend, while keeping admin approval + PDF email for consolidated (module) certificates.

**Architecture:** The app is a Vite + React SPA over a dual backend (`isSupabaseConfigured ? Supabase : localStorage mock`). Materials/quizzes/certs are derived from the catalog, so new tools are pure data. Certificate PDFs are currently generated client-side (`jsPDF`); this plan ports that generation into serverless functions (`/api`) so PDFs can be attached to Resend emails. A DB trigger makes single-cert issuance DB-authoritative; module certs keep their `cert_status` approval workflow.

**Tech Stack:** React 18, React Router 6, Vite 5, Supabase (Postgres + RLS + RPC), Vercel serverless (Node), Resend, jsPDF, qrcode.

**Testing note:** This repo has **no test framework** (no test deps; ESLint only) and the spec states verification is manual/functional. Each task therefore verifies with `npm run build`, `npm run lint`, targeted Node smoke scripts, and explicit browser checks — not unit tests. Do **not** add a test framework unless a later task says so.

**Conventions:**
- Follow `AGENTS.md`: this is a customised Next-less Vite app — do not introduce Next.js patterns.
- Per repo/global instruction: commit as the logged-in user; **no Claude credits / Co-Authored-By** lines in commits.
- Run all commands from the repo root `/Users/dinokage/dev/symb-ai`.

---

## File Structure

**Create:**
- `api/_assets.js` — the two certificate images (`signature.jpg`, `logo.jpg`) as base64 data URIs, so serverless functions have them without the CDN `/public` folder.
- `api/_certificate-pdf.js` — server-side PDF builders returning a `Buffer` (single + module), ported from `src/lib/certificates.js`.
- `api/_module-meta.js` — minimal server copy of module-certificate wording (avoids importing the client catalog chain).
- `api/issue-certificate.js` — authenticated student self-serve: issue + email single-cert PDF.

**Modify:**
- `src/data/database.js` — add Sakana AI + GLM 5.2 catalog entries.
- `src/lib/quizFromMaterial.js` — `PASS_PERCENT` 80 → 70.
- `api/approve-certificate.js` — `PASS_PERCENT` 80 → 70; attach module PDF to the email.
- `supabase/schema.sql` + `supabase/migration.sql` — 80 → 70; auto-approve non-module passing rows; backfill.
- `src/lib/certificateApi.js` — add `issueCertificate()`; `approveCertificate()` passes `moduleLabel`.
- `src/features/dashboard/pages/QuizRunner.jsx` — auto-approve + fire auto-email on pass.
- `src/features/dashboard/pages/CertificatePage.jsx` — drop single-cert approval gate.
- `src/features/dashboard/pages/CertificatesPage.jsx` — single certs always downloadable; remove request/pending UI.
- `src/features/admin/pages/AdminLeaderboard.jsx` — remove single-cert approve/reject; route module approval through the emailing endpoint; "Email certificate" resends the PDF.
- `src/features/admin/pages/AdminStudentProfile.jsx` — remove single-cert approve; always allow download.

---

## Task 1: Add Sakana AI & GLM 5.2 to the catalog

**Files:**
- Modify: `src/data/database.js` (end of the `ai-tools` `items` array — after the `Devin` entry, before the `]` at line ~196)

- [ ] **Step 1: Insert the two entries**

In `src/data/database.js`, find the end of the `ai-tools` items array (the `Devin` entry ends at ~line 195):

```javascript
                "url": "https://devin.ai/",
                "badges": [],
                "tags": [
                    "AI Tools"
                ]
            }
        ]
    },
    "frameworks-agents": {
```

Change it to (add a comma after the closing `}` of Devin, then the two new objects):

```javascript
                "url": "https://devin.ai/",
                "badges": [],
                "tags": [
                    "AI Tools"
                ]
            },
            {
                "name": "Sakana AI",
                "description": "A Tokyo-based AI research lab applying nature-inspired methods — evolution, collective intelligence, and model merging — to build efficient foundation models and automate scientific discovery, including 'The AI Scientist' and evolutionary model-merge techniques.",
                "url": "https://sakana.ai/",
                "badges": [
                    "NEW"
                ],
                "tags": [
                    "AI Tools"
                ]
            },
            {
                "name": "GLM 5.2",
                "description": "An open frontier large language model in Zhipu AI's GLM family, tuned for strong reasoning, coding, and agentic tool-use with long-context support, positioned as a cost-efficient alternative to closed frontier models.",
                "url": "https://z.ai/",
                "badges": [
                    "NEW"
                ],
                "tags": [
                    "AI Tools"
                ]
            }
        ]
    },
    "frameworks-agents": {
```

- [ ] **Step 2: Verify the build compiles**

Run: `npm run build`
Expected: build succeeds with no errors (Vite emits `dist/`).

- [ ] **Step 3: Verify in the browser**

Run: `npm run dev`, open `http://localhost:5173/dashboard/materials`, confirm **Sakana AI** and **GLM 5.2** appear. Click each → the document view renders; switch to the slides view → slides render. Open `/dashboard/quizzes` → both have a quiz.
Expected: both tools show a generated document, slides, and a quiz.

- [ ] **Step 4: Commit**

```bash
git add src/data/database.js
git commit -m "feat: add Sakana AI and GLM 5.2 to AI Tools catalog"
```

---

## Task 2: Lower course pass mark to 70% (JS constants)

**Files:**
- Modify: `src/lib/quizFromMaterial.js:15`
- Modify: `api/approve-certificate.js:22`

- [ ] **Step 1: Change the JS source of truth**

In `src/lib/quizFromMaterial.js` change line 15:

```javascript
export const PASS_PERCENT = 80;
```

to:

```javascript
export const PASS_PERCENT = 70;
```

Also update the comment on line 10 from `// Passing score is 70% (see PASS_PERCENT).` to `// Passing score is 60% (see PASS_PERCENT).`

- [ ] **Step 2: Change the serverless constant**

In `api/approve-certificate.js` change line 22:

```javascript
const PASS_PERCENT = 80;
```

to:

```javascript
const PASS_PERCENT = 70;
```

- [ ] **Step 3: Verify propagation**

Run: `grep -rn "PASS_PERCENT = \|>= 80\|percentage < PASS" src api`
Expected: no remaining `= 80` for a pass constant in `src/` or `api/` (SQL handled in Task 3). `quizStore.js` and `certificates.js` re-export the constant, so all pages now read 70.

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: success. Visit `/dashboard/certificates` — copy reads "Earn a course certificate at 70% per quiz…".

- [ ] **Step 5: Commit**

```bash
git add src/lib/quizFromMaterial.js api/approve-certificate.js
git commit -m "feat: lower course quiz pass mark to 70%"
```

---

## Task 3: Postgres — 70% threshold + auto-approve single certs + migration

**Files:**
- Modify: `supabase/schema.sql` (trigger fn ~177-197; `get_public_certificate` ~438-468)
- Modify: `supabase/migration.sql` (append idempotent block)

> These files are applied by a human against Supabase (`schema.sql` for fresh installs, `migration.sql` for existing DBs). There is no local Postgres, so verification is syntactic + a note to apply manually.

- [ ] **Step 1: Update the cert-id trigger to 70% and auto-approve single certs**

In `supabase/schema.sql`, replace the `set_quiz_attempt_cert_id` function (currently lines ~177-188):

```sql
create or replace function public.set_quiz_attempt_cert_id()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.percentage, 0) >= 80 and new.cert_id is null then
    new.cert_id := public.certificate_id(new.user_id, new.resource_name);
  end if;

  return new;
end;
$$;
```

with:

```sql
create or replace function public.set_quiz_attempt_cert_id()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.percentage, 0) >= 70 and new.cert_id is null then
    new.cert_id := public.certificate_id(new.user_id, new.resource_name);
  end if;

  -- Single course certificates no longer require admin approval: auto-approve
  -- any passing NON-module attempt. Module (consolidated) certificates keep
  -- their explicit status — they are sentinel rows whose resource_name is
  -- 'module-cert:<slug>' (plus the legacy 'AI & Emerging Technologies Workshop').
  if coalesce(new.percentage, 0) >= 70
     and new.resource_name not like 'module-cert:%'
     and new.resource_name <> 'AI & Emerging Technologies Workshop'
     and coalesce(new.cert_status, 'none') in ('none', 'pending') then
    new.cert_status := 'approved';
  end if;

  return new;
end;
$$;
```

- [ ] **Step 2: Update the backfill statement (80 → 70) and add a cert_status backfill**

In `supabase/schema.sql`, replace the existing backfill (lines ~195-197):

```sql
update public.quiz_attempts
   set cert_id = public.certificate_id(user_id, resource_name)
 where cert_id is null and percentage >= 80;
```

with:

```sql
update public.quiz_attempts
   set cert_id = public.certificate_id(user_id, resource_name)
 where cert_id is null and percentage >= 70;

-- Auto-approve historical passing single-course certificates.
update public.quiz_attempts
   set cert_status = 'approved'
 where percentage >= 70
   and resource_name not like 'module-cert:%'
   and resource_name <> 'AI & Emerging Technologies Workshop'
   and coalesce(cert_status, 'none') in ('none', 'pending');
```

- [ ] **Step 3: Lower the public verify RPC threshold (schema.sql)**

In `supabase/schema.sql`, in `public.get_public_certificate`, change the line (~457):

```sql
  where q.percentage >= 80
```

to:

```sql
  where q.percentage >= 70
```

- [ ] **Step 4: Add an idempotent migration block for live databases**

Append to the end of `supabase/migration.sql`:

```sql
-- ===========================================================================
-- 2026-07-08: 70% pass mark + auto-issued single-course certificates
-- ===========================================================================

-- 1. Lower the cert-id threshold and auto-approve passing single certs.
create or replace function public.set_quiz_attempt_cert_id()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.percentage, 0) >= 70 and new.cert_id is null then
    new.cert_id := public.certificate_id(new.user_id, new.resource_name);
  end if;

  if coalesce(new.percentage, 0) >= 70
     and new.resource_name not like 'module-cert:%'
     and new.resource_name <> 'AI & Emerging Technologies Workshop'
     and coalesce(new.cert_status, 'none') in ('none', 'pending') then
    new.cert_status := 'approved';
  end if;

  return new;
end;
$$;

-- 2. Lower the public verification RPC threshold to 70%.
create or replace function public.get_public_certificate(p_cert_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'id', coalesce(q.cert_id, public.certificate_id(q.user_id, q.resource_name)),
    'resource_name', q.resource_name,
    'percentage', q.percentage,
    'created_at', q.created_at,
    'student_name', coalesce(p.full_name, p.email),
    'cert_status', q.cert_status
  ) into result
  from public.quiz_attempts q
  join public.profiles p on p.user_id = q.user_id
  where q.percentage >= 70
    and (
      q.cert_id = p_cert_id
      or public.certificate_id(q.user_id, q.resource_name) = p_cert_id
    )
  order by q.percentage desc, q.created_at asc
  limit 1;

  return result;
end;
$$;

grant execute on function public.get_public_certificate(text) to anon, authenticated;

-- 3. Backfill: cert ids for newly-passing rows + approve historical single certs.
update public.quiz_attempts
   set cert_id = public.certificate_id(user_id, resource_name)
 where cert_id is null and percentage >= 70;

update public.quiz_attempts
   set cert_status = 'approved'
 where percentage >= 70
   and resource_name not like 'module-cert:%'
   and resource_name <> 'AI & Emerging Technologies Workshop'
   and coalesce(cert_status, 'none') in ('none', 'pending');
```

- [ ] **Step 5: Verify SQL syntax locally (no DB required)**

Run: `grep -n ">= 70" supabase/schema.sql supabase/migration.sql`
Expected: the trigger, backfill, and RPC all show `>= 70`; no `>= 80` remains for the pass threshold (`grep -n ">= 80" supabase/*.sql` returns nothing).

- [ ] **Step 6: Commit (and note manual apply)**

```bash
git add supabase/schema.sql supabase/migration.sql
git commit -m "feat: 70% pass mark and auto-approve single certs in schema"
```

> **Manual step for the operator:** run `supabase/migration.sql` against the live Supabase project (SQL editor) so the trigger/RPC/backfill take effect. Offline/mock mode needs no DB change.

---

## Task 4: Base64-embed the certificate images for serverless use

**Files:**
- Create: `api/_assets.js`

Vercel serverless functions do not reliably see the CDN-served `/public` folder, so the two images are inlined as data URIs.

- [ ] **Step 1: Generate `api/_assets.js` from the public images**

Run this from the repo root (reads the JPEGs and writes the module — do not hand-type the base64):

```bash
node -e '
const fs = require("fs");
const sig = fs.readFileSync("public/signature.jpg").toString("base64");
const logo = fs.readFileSync("public/logo.jpg").toString("base64");
const out =
`// AUTO-GENERATED from public/signature.jpg and public/logo.jpg.
// Regenerate with the node one-liner in docs/superpowers/plans/2026-07-08-certificates-materials.md (Task 4).
// Embedded so serverless PDF generation does not depend on the CDN /public folder.
export const SIGNATURE_JPEG_DATA_URI = "data:image/jpeg;base64,${sig}";
export const LOGO_JPEG_DATA_URI = "data:image/jpeg;base64,${logo}";
`;
fs.writeFileSync("api/_assets.js", out);
console.log("wrote api/_assets.js", out.length, "bytes");
'
```

- [ ] **Step 2: Verify the file exports two data URIs**

Run: `node -e 'import("./api/_assets.js").then(m => console.log(m.SIGNATURE_JPEG_DATA_URI.slice(0,30), "|", m.LOGO_JPEG_DATA_URI.slice(0,30)))'`
Expected: prints `data:image/jpeg;base64,... | data:image/jpeg;base64,...`

- [ ] **Step 3: Commit**

```bash
git add api/_assets.js
git commit -m "chore: embed certificate images as base64 for serverless PDF"
```

---

## Task 5: Server-side certificate PDF builders

**Files:**
- Create: `api/_certificate-pdf.js`

Ports `downloadCertificatePDF` / `downloadModuleCertificatePDF` from `src/lib/certificates.js` to Node: same layout, but images come from `api/_assets.js`, dimensions come from `doc.getImageProperties`, and the output is a `Buffer` instead of a browser download. The verification URL is passed in (no `window`).

- [ ] **Step 1: Create `api/_certificate-pdf.js`**

```javascript
// Server-side certificate PDF generation.
// Layout is kept in lock-step with src/lib/certificates.js (A4 landscape). The
// only differences from the client version: images are embedded base64 data
// URIs, image dimensions come from jsPDF's getImageProperties (no browser
// Image/canvas), the verify URL is passed in (no window), and the result is a
// Node Buffer for emailing rather than a browser download.

import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { SIGNATURE_JPEG_DATA_URI, LOGO_JPEG_DATA_URI } from './_assets.js';

const ORG = 'Symbiosys Technologies';

async function qrDataUrl(text) {
  try {
    return await QRCode.toDataURL(text, { margin: 1, width: 220, color: { dark: '#1e1b4b', light: '#ffffff' } });
  } catch {
    return null;
  }
}

function drawFooter(doc, cx, W, H, cert, verifyUrl, qr) {
  const footerRowTop = H - 190;
  const signLineY = footerRowTop + 58;

  // Left column – signature image + rule + labels
  const leftX = 170;
  const sigW = 120;
  try {
    const p = doc.getImageProperties(SIGNATURE_JPEG_DATA_URI);
    const sigH = (p.height / p.width) * sigW;
    doc.addImage(SIGNATURE_JPEG_DATA_URI, 'JPEG', leftX - sigW / 2, footerRowTop, sigW, sigH);
  } catch { /* image optional */ }
  doc.setDrawColor('#9ca3af'); doc.setLineWidth(1);
  doc.line(leftX - 80, signLineY, leftX + 80, signLineY);
  doc.setTextColor('#111827'); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text('Symbiosys Technologies', leftX, signLineY + 16, { align: 'center' });
  doc.setTextColor('#6b7280'); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text('Authorized Signature', leftX, signLineY + 30, { align: 'center' });

  // Centre column – logo vertically centred in the image band
  const logoW = 130;
  try {
    const p = doc.getImageProperties(LOGO_JPEG_DATA_URI);
    const logoH = (p.height / p.width) * logoW;
    const logoBandH = signLineY - footerRowTop;
    const logoTopY = footerRowTop + (logoBandH - logoH) / 2;
    doc.addImage(LOGO_JPEG_DATA_URI, 'JPEG', cx - logoW / 2, logoTopY, logoW, logoH);
  } catch { /* image optional */ }

  // Right column – QR + ID block
  const qrSize = 72;
  const qrX = W - 218;
  const qrY = footerRowTop;
  const idX = qrX + qrSize + 12;
  if (qr) doc.addImage(qr, 'PNG', qrX, qrY, qrSize, qrSize);
  doc.setTextColor('#374151'); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text('Certificate ID', idX, qrY + 14, { align: 'left' });
  doc.setTextColor('#111827'); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text(cert.id, idX, qrY + 27, { align: 'left', maxWidth: W - idX - 50 });
  doc.setTextColor('#6b7280'); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(new Date(cert.date).toLocaleDateString(), idX, qrY + 41, { align: 'left' });
}

// Single course certificate. `cert` = { id, resourceName, categoryLabel, percentage, date }.
export async function buildCertificatePdfBuffer(cert, studentName, verifyUrl) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const cx = W / 2;

  doc.setFillColor('#ffffff'); doc.rect(0, 0, W, H, 'F');
  doc.setDrawColor('#4f46e5'); doc.setLineWidth(6); doc.rect(24, 24, W - 48, H - 48);
  doc.setDrawColor('#c7d2fe'); doc.setLineWidth(1.5); doc.rect(36, 36, W - 72, H - 72);
  doc.setFillColor('#4f46e5'); doc.rect(36, 36, W - 72, 10, 'F');

  doc.setTextColor('#6b7280'); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text(ORG.toUpperCase(), cx, 90, { align: 'center' });
  doc.setTextColor('#4f46e5'); doc.setFont('helvetica', 'bold'); doc.setFontSize(34);
  doc.text('Course Completion Certificate', cx, 140, { align: 'center' });
  doc.setTextColor('#6b7280'); doc.setFont('helvetica', 'normal'); doc.setFontSize(13);
  doc.text('This certifies that', cx, 180, { align: 'center' });
  doc.setTextColor('#111827'); doc.setFont('helvetica', 'bold'); doc.setFontSize(30);
  doc.text(studentName || 'Student', cx, 220, { align: 'center' });
  doc.setDrawColor('#e5e7eb'); doc.setLineWidth(1); doc.line(cx - 160, 232, cx + 160, 232);
  doc.setTextColor('#374151'); doc.setFont('helvetica', 'normal'); doc.setFontSize(13);
  doc.text('has successfully completed the learning module and assessment for', cx, 262, { align: 'center' });
  doc.setTextColor('#4f46e5'); doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
  doc.text(cert.resourceName, cx, 296, { align: 'center' });
  doc.setTextColor('#6b7280'); doc.setFont('helvetica', 'normal'); doc.setFontSize(12);
  doc.text(`Category: ${cert.categoryLabel}   ·   Score: ${cert.percentage}%   ·   Successfully Completed`, cx, 322, { align: 'center' });

  const qr = await qrDataUrl(verifyUrl);
  drawFooter(doc, cx, W, H, cert, verifyUrl, qr);

  doc.setTextColor('#4f46e5'); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text('Successfully Completed – Certified by Symbiosys Technologies', cx, H - 50, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}

// Module (consolidated) certificate. `mod` = { heading, title, dedication, tagline }.
export async function buildModuleCertificatePdfBuffer(mod, cert, studentName, verifyUrl) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const cx = W / 2;

  doc.setFillColor('#ffffff'); doc.rect(0, 0, W, H, 'F');
  doc.setDrawColor('#4f46e5'); doc.setLineWidth(6); doc.rect(24, 24, W - 48, H - 48);
  doc.setDrawColor('#c7d2fe'); doc.setLineWidth(1.5); doc.rect(36, 36, W - 72, H - 72);
  doc.setFillColor('#4f46e5'); doc.rect(36, 36, W - 72, 10, 'F');

  doc.setTextColor('#6b7280'); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text(ORG.toUpperCase(), cx, 90, { align: 'center' });
  doc.setTextColor('#4f46e5'); doc.setFont('helvetica', 'bold'); doc.setFontSize(34);
  doc.text('Course Completion Certificate', cx, 140, { align: 'center' });
  doc.setTextColor('#6b7280'); doc.setFont('helvetica', 'normal'); doc.setFontSize(13);
  doc.text('This certifies that', cx, 178, { align: 'center' });
  doc.setTextColor('#111827'); doc.setFont('helvetica', 'bold'); doc.setFontSize(30);
  doc.text(studentName || 'Student', cx, 216, { align: 'center' });
  doc.setDrawColor('#e5e7eb'); doc.setLineWidth(1); doc.line(cx - 170, 228, cx + 170, 228);
  doc.setTextColor('#374151'); doc.setFont('helvetica', 'normal'); doc.setFontSize(13);
  doc.text(mod.heading, cx, 258, { align: 'center' });
  doc.setTextColor('#4f46e5'); doc.setFont('helvetica', 'bold'); doc.setFontSize(24);
  doc.text(mod.title, cx, 292, { align: 'center', maxWidth: W - 160 });
  doc.setTextColor('#6b7280'); doc.setFont('helvetica', 'italic'); doc.setFontSize(13);
  doc.text(mod.dedication, cx, 322, { align: 'center' });

  const qr = await qrDataUrl(verifyUrl);
  drawFooter(doc, cx, W, H, cert, verifyUrl, qr);

  doc.setTextColor('#4f46e5'); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text(mod.tagline, cx, H - 50, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}
```

- [ ] **Step 2: Smoke-test the builder generates a real PDF**

Run:

```bash
node -e '
import("./api/_certificate-pdf.js").then(async (m) => {
  const buf = await m.buildCertificatePdfBuffer(
    { id: "SYM-TEST-0001", resourceName: "Sakana AI", categoryLabel: "AI Tools", percentage: 88, date: new Date().toISOString() },
    "Jane Doe",
    "https://example.com/verify/SYM-TEST-0001"
  );
  const fs = require("fs");
  fs.writeFileSync("/tmp/cert-smoke.pdf", buf);
  console.log("bytes:", buf.length, "header:", buf.slice(0,5).toString());
});
'
```

Expected: prints `bytes: <a few thousand> header: %PDF-`. (Optionally `open /tmp/cert-smoke.pdf` to eyeball the layout.)

- [ ] **Step 3: Commit**

```bash
git add api/_certificate-pdf.js
git commit -m "feat: server-side certificate PDF builders for email attachments"
```

---

## Task 6: Module-certificate wording helper (server)

**Files:**
- Create: `api/_module-meta.js`

A minimal server copy of `moduleCertMeta` from `src/lib/workshops.js`, so `approve-certificate.js` can build the module PDF without importing the client catalog chain.

- [ ] **Step 1: Create `api/_module-meta.js`**

```javascript
// Minimal server copy of the module-certificate wording from
// src/lib/workshops.js (moduleCertMeta). Kept tiny and dependency-free so the
// serverless function does not import the client catalog/database modules.

const MODULE_CERT_PREFIX = 'module-cert:';

const MODULE_META = {
  'ai-tools': {
    title: 'Artificial Intelligence and Emerging Technologies',
    heading: 'has successfully completed the Workshop on',
    dedication: 'Dedicated to Continuous learning and innovation',
    tagline: 'Learning Today, Innovating Tomorrow',
  },
};

export function isModuleResourceName(name) {
  return typeof name === 'string' && name.startsWith(MODULE_CERT_PREFIX);
}

export function moduleSlugFromName(name) {
  return typeof name === 'string' && name.startsWith(MODULE_CERT_PREFIX)
    ? name.slice(MODULE_CERT_PREFIX.length)
    : null;
}

// `label` is the current human module title, passed from the client (which has
// the live catalog). Falls back to a title-cased slug.
export function moduleMetaFor(slug, label) {
  const resolvedLabel = label || String(slug || '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  const base = MODULE_META[slug] || {
    title: resolvedLabel,
    heading: 'has successfully completed every module in',
    dedication: 'Dedicated to Continuous learning and innovation',
    tagline: 'Learning Today, Innovating Tomorrow',
  };
  return { slug, label: resolvedLabel, ...base };
}
```

- [ ] **Step 2: Verify it imports**

Run: `node -e 'import("./api/_module-meta.js").then(m => console.log(m.moduleMetaFor("ai-tools").title, "|", m.moduleMetaFor("data-analytics","Data & Analytics").heading))'`
Expected: `Artificial Intelligence and Emerging Technologies | has successfully completed every module in`

- [ ] **Step 3: Commit**

```bash
git add api/_module-meta.js
git commit -m "feat: server module-certificate wording helper"
```

---

## Task 7: New endpoint — `api/issue-certificate.js` (student self-serve, emails single-cert PDF)

**Files:**
- Create: `api/issue-certificate.js`

Mirrors `api/approve-certificate.js` but the caller issues **their own** passing single certificate: verify ownership + pass, set `cert_status='approved'`, mint a 24h token, generate the single-cert PDF, and email it as an attachment (with the download link as a secondary fallback).

- [ ] **Step 1: Create `api/issue-certificate.js`**

```javascript
// POST /api/issue-certificate
// -----------------------------------------------------------------------------
// Student self-serve. When a user passes a single-course quiz (>= 70%) their
// certificate is issued automatically — no admin approval. This endpoint marks
// the attempt approved, mints a 24h download token, generates the certificate
// PDF, and emails it to the student as an attachment (with the link as a
// secondary fallback).
//
// Auth: caller sends their Supabase access token as `Authorization: Bearer
// <token>`. The caller may only issue certificates for THEIR OWN attempts.
//
// Env: SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY,
//      RESEND_API_KEY (optional), EMAIL_FROM, PUBLIC_BASE_URL (optional).

import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { buildCertificatePdfBuffer } from './_certificate-pdf.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const PASS_PERCENT = 70;

function adminClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Server not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

function baseUrl(req) {
  const explicit = (process.env.PUBLIC_BASE_URL || process.env.VITE_PUBLIC_BASE_URL || '').trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return host ? `https://${host}` : '';
}

async function readJson(req) {
  if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  return await new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } });
  });
}

function emailHtml({ studentName, resourceName, link }) {
  return `<!doctype html><html><body style="margin:0;background:#f3f4f6;padding:32px 0;font-family:Segoe UI,Arial,sans-serif;color:#111827">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb">
      <tr><td style="background:#4f46e5;height:8px"></td></tr>
      <tr><td style="padding:32px 40px">
        <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;color:#6b7280;text-transform:uppercase">Symbiosys Technologies</p>
        <h1 style="margin:0 0 16px;font-size:22px;color:#4f46e5">Congratulations — you earned a certificate 🎉</h1>
        <p style="margin:0 0 12px;font-size:15px">Hi ${studentName},</p>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.5">You passed the assessment for <strong>${resourceName}</strong>. Your certificate is attached to this email as a PDF.</p>
        <p style="margin:24px 0;text-align:center">
          <a href="${link}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:600">Or download it here</a>
        </p>
        <p style="margin:16px 0 0;font-size:12px;color:#9ca3af">You can also download it any time from your dashboard under Certificates.</p>
      </td></tr>
      <tr><td style="padding:16px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af">Certified by Symbiosys Technologies</td></tr>
    </table>
  </td></tr></table></body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let admin;
  try { admin = adminClient(); } catch (e) { return res.status(500).json({ error: e.message }); }

  try {
    const { attemptId } = await readJson(req);
    if (!attemptId) return res.status(400).json({ error: 'attemptId is required' });

    // --- Authenticate the caller ------------------------------------------
    const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
    if (!bearer) return res.status(401).json({ error: 'Not authenticated' });
    const { data: userData, error: userErr } = await admin.auth.getUser(bearer);
    if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid or expired session' });
    const caller = userData.user;

    // --- Load the attempt + authorize ownership ---------------------------
    const { data: attempt, error: aErr } = await admin
      .from('quiz_attempts').select('*').eq('id', attemptId).maybeSingle();
    if (aErr || !attempt) return res.status(404).json({ error: 'Quiz attempt not found' });
    if (attempt.user_id !== caller.id) return res.status(403).json({ error: 'You can only issue your own certificate.' });
    if (attempt.resource_name.startsWith('module-cert:')) {
      return res.status(400).json({ error: 'Module certificates require admin approval.' });
    }
    if (Number(attempt.percentage) < PASS_PERCENT) {
      return res.status(400).json({ error: 'This attempt has not passed the quiz.' });
    }

    // --- Resolve cert id + approve ----------------------------------------
    let certId = attempt.cert_id;
    if (!certId) {
      const { data: rpcId } = await admin.rpc('certificate_id', {
        p_user_id: attempt.user_id, p_resource_name: attempt.resource_name,
      });
      certId = rpcId;
    }
    await admin.from('quiz_attempts')
      .update({ cert_status: 'approved', ...(certId ? { cert_id: certId } : {}) })
      .eq('id', attemptId);

    // --- Mint a 24h download token ----------------------------------------
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + DAY_MS);
    await admin.from('cert_tokens').insert({
      token,
      user_id: attempt.user_id,
      resource_name: attempt.resource_name,
      cert_id: certId || '',
      expires_at: expiresAt.toISOString(),
    });
    const base = baseUrl(req);
    const link = `${base}/certificate-download/${token}`;

    // --- Student details --------------------------------------------------
    const { data: studentProfile } = await admin
      .from('profiles').select('email, full_name').eq('user_id', attempt.user_id).maybeSingle();
    const studentName = studentProfile?.full_name || studentProfile?.email || 'Student';
    const to = studentProfile?.email;

    // --- Build the PDF ----------------------------------------------------
    const pdf = await buildCertificatePdfBuffer(
      {
        id: certId || '',
        resourceName: attempt.resource_name,
        categoryLabel: attempt.category_label || 'General',
        percentage: Math.round(Number(attempt.percentage)),
        date: attempt.created_at,
      },
      studentName,
      `${base}/verify/${certId || ''}`
    );

    // --- Email the PDF (best-effort) --------------------------------------
    let emailed = false;
    let emailError = null;
    const resendKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (resendKey && from && to) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(resendKey);
        const { error } = await resend.emails.send({
          from, to,
          subject: `Your ${attempt.resource_name} certificate`,
          html: emailHtml({ studentName, resourceName: attempt.resource_name, link }),
          attachments: [{ filename: `${certId || 'certificate'}.pdf`, content: pdf.toString('base64') }],
        });
        if (error) emailError = error.message || String(error);
        else emailed = true;
      } catch (e) {
        emailError = e.message || String(e);
      }
    } else if (!resendKey || !from) {
      emailError = 'Email is not configured (RESEND_API_KEY / EMAIL_FROM missing).';
    } else if (!to) {
      emailError = 'No email address on file.';
    }

    return res.status(200).json({ ok: true, emailed, emailError, link, to, expiresAt: expiresAt.toISOString() });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Unexpected server error' });
  }
}
```

> Note: `attempt.category_label` is not a DB column; the fallback `'General'` is used (matching how `AdminLeaderboard.handleDownload` already builds an admin-side cert). Category is cosmetic on the PDF.

- [ ] **Step 2: Verify it parses/imports cleanly**

Run: `node -e 'import("./api/issue-certificate.js").then(() => console.log("ok")).catch(e => { console.error(e); process.exit(1); })'`
Expected: prints `ok` (module loads; the handler is not invoked).

- [ ] **Step 3: Commit**

```bash
git add api/issue-certificate.js
git commit -m "feat: /api/issue-certificate auto-issues and emails single-cert PDF"
```

---

## Task 8: Attach the module PDF in `api/approve-certificate.js`

**Files:**
- Modify: `api/approve-certificate.js`

The admin-approval path now attaches the **module** certificate PDF (this endpoint is used only for consolidated/module certs after this change).

- [ ] **Step 1: Import the PDF + module-meta helpers**

At the top of `api/approve-certificate.js`, below the existing imports:

```javascript
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
```

add:

```javascript
import { buildModuleCertificatePdfBuffer, buildCertificatePdfBuffer } from './_certificate-pdf.js';
import { moduleMetaFor, moduleSlugFromName, isModuleResourceName } from './_module-meta.js';
```

- [ ] **Step 2: Accept `moduleLabel` in the request body**

Find (inside the handler `try`):

```javascript
    const { attemptId } = await readJson(req);
    if (!attemptId) return res.status(400).json({ error: 'attemptId is required' });
```

Replace with:

```javascript
    const { attemptId, moduleLabel } = await readJson(req);
    if (!attemptId) return res.status(400).json({ error: 'attemptId is required' });
```

- [ ] **Step 3: Build the PDF and attach it to the email**

Find the email-send block:

```javascript
    if (resendKey && from && to) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(resendKey);
        const { error } = await resend.emails.send({
          from,
          to,
          subject: `Your ${attempt.resource_name} certificate is approved`,
          html: emailHtml({
            studentName,
            resourceName: attempt.resource_name,
            link,
            expiresAtLabel: expiresAt.toUTCString(),
          }),
        });
        if (error) emailError = error.message || String(error);
        else emailed = true;
      } catch (e) {
        emailError = e.message || String(e);
      }
    } else if (!resendKey || !from) {
```

Replace with:

```javascript
    // Build the certificate PDF for the email attachment. Module (consolidated)
    // certs use the module template; anything else uses the course template.
    let pdf = null;
    try {
      const base = baseUrl(req);
      const verifyUrl = `${base}/verify/${certId || attempt.cert_id || ''}`;
      const certForPdf = {
        id: certId || attempt.cert_id || '',
        resourceName: attempt.resource_name,
        categoryLabel: 'General',
        percentage: Math.round(Number(attempt.percentage)),
        date: attempt.created_at,
      };
      if (isModuleResourceName(attempt.resource_name)) {
        const slug = moduleSlugFromName(attempt.resource_name);
        pdf = await buildModuleCertificatePdfBuffer(moduleMetaFor(slug, moduleLabel), certForPdf, studentName, verifyUrl);
      } else {
        pdf = await buildCertificatePdfBuffer(certForPdf, studentName, verifyUrl);
      }
    } catch (e) {
      // A PDF failure must not block approval; email falls back to link-only.
      pdf = null;
    }

    if (resendKey && from && to) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(resendKey);
        const { error } = await resend.emails.send({
          from,
          to,
          subject: `Your ${attempt.resource_name} certificate is approved`,
          html: emailHtml({
            studentName,
            resourceName: attempt.resource_name,
            link,
            expiresAtLabel: expiresAt.toUTCString(),
          }),
          ...(pdf ? { attachments: [{ filename: `${certId || 'certificate'}.pdf`, content: pdf.toString('base64') }] } : {}),
        });
        if (error) emailError = error.message || String(error);
        else emailed = true;
      } catch (e) {
        emailError = e.message || String(e);
      }
    } else if (!resendKey || !from) {
```

- [ ] **Step 4: Verify import/parse**

Run: `node -e 'import("./api/approve-certificate.js").then(() => console.log("ok")).catch(e => { console.error(e); process.exit(1); })'`
Expected: prints `ok`.

- [ ] **Step 5: Commit**

```bash
git add api/approve-certificate.js
git commit -m "feat: attach certificate PDF to approval email"
```

---

## Task 9: `certificateApi.js` — add `issueCertificate()`, pass `moduleLabel`

**Files:**
- Modify: `src/lib/certificateApi.js`

- [ ] **Step 1: Add `moduleLabel` to the approve request body**

In `src/lib/certificateApi.js`, change the signature and fetch body of `approveCertificate`. Find:

```javascript
export async function approveCertificate(attempt) {
  const certId = attempt.cert_id || certificateId(attempt.user_id, attempt.resource_name);
```

Replace with:

```javascript
export async function approveCertificate(attempt, opts = {}) {
  const certId = attempt.cert_id || certificateId(attempt.user_id, attempt.resource_name);
```

Then find the fetch body inside `approveCertificate`:

```javascript
        body: JSON.stringify({ attemptId: attempt.id }),
```

Replace with:

```javascript
        body: JSON.stringify({ attemptId: attempt.id, moduleLabel: opts.moduleLabel }),
```

- [ ] **Step 2: Add `issueCertificate()` at the end of the file**

Append to `src/lib/certificateApi.js` (before or after `redeemCertToken`, at module scope):

```javascript
// Auto-issue a passed single-course certificate for the CURRENT user and email
// the PDF. Called by the quiz runner right after a passing submit. Best-effort:
// callers should not block the UI on the result.
// Returns: { ok, emailed, emailError, link, to, expiresAt } | { ok:false, error }
export async function issueCertificate(attempt) {
  const certId = attempt.cert_id || certificateId(attempt.user_id, attempt.resource_name);

  if (isSupabaseConfigured) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/issue-certificate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ attemptId: attempt.id }),
      });
      const body = await res.json().catch(() => null);
      if (res.ok) return body || { ok: true, emailed: false };
      // Endpoint missing / not deployed / mock-served: the cert is already
      // approved in the DB (trigger + client), so this is non-fatal.
      return { ok: false, emailed: false, error: body?.error || `HTTP ${res.status}` };
    } catch (e) {
      return { ok: false, emailed: false, error: e.message || 'network error' };
    }
  }

  // --- Mock mode: approve locally + mint a local token (no real email) ------
  await quizAttempts.update(attempt.id, { cert_status: 'approved', cert_id: certId });
  const token = `${MOCK_TOKEN_PREFIX}${mockStore.genId()}`;
  mockStore.insert('cert_tokens', {
    token,
    user_id: attempt.user_id,
    resource_name: attempt.resource_name,
    cert_id: certId,
    expires_at: new Date(Date.now() + DAY_MS).toISOString(),
  });
  const link = `${window.location.origin}/certificate-download/${token}`;
  return { ok: true, emailed: false, mock: true, link };
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: success (all imports `quizAttempts`, `mockStore`, `certificateId`, `supabase`, `isSupabaseConfigured`, `MOCK_TOKEN_PREFIX`, `DAY_MS` already exist at module scope in this file).

- [ ] **Step 4: Commit**

```bash
git add src/lib/certificateApi.js
git commit -m "feat: issueCertificate() client helper + moduleLabel on approve"
```

---

## Task 10: `QuizRunner` — auto-approve single cert on pass + fire the email

**Files:**
- Modify: `src/features/dashboard/pages/QuizRunner.jsx`

- [ ] **Step 1: Import `issueCertificate`**

Find (line 6-7):

```javascript
import { quizAttempts, history } from '../../../lib/backend';
import { certificateId, PASS_PERCENT } from '../../../lib/certificates';
```

Replace with:

```javascript
import { quizAttempts, history } from '../../../lib/backend';
import { certificateId, PASS_PERCENT } from '../../../lib/certificates';
import { issueCertificate } from '../../../lib/certificateApi';
```

- [ ] **Step 2: Auto-approve on insert and fire the email**

Find the `submit` body (lines 80-104):

```javascript
    if (user) {
      const { data, error } = await quizAttempts.insert({
        user_id: user.id,
        resource_name: graded.resource_name,
        score: graded.score,
        max_score: graded.max_score,
        percentage: graded.percentage,
        correct_count: graded.correct_count,
        wrong_count: graded.wrong_count,
        time_taken_s: graded.time_taken_s,
        status: 'completed',
        answers: graded.answers,
        cert_id: graded.percentage >= PASS_PERCENT ? certificateId(user.id, graded.resource_name) : null,
      });
      if (error) {
        alert('Failed to save quiz attempt: ' + (error.message || JSON.stringify(error)));
      }
      if (data) {
        graded.id = data.id;
        graded.user_id = user.id;
        graded.cert_id = data.cert_id || (graded.percentage >= PASS_PERCENT ? certificateId(user.id, graded.resource_name) : null);
        graded.cert_status = data.cert_status || 'none';
      }
      await history.log(user.id, 'quiz', `Completed quiz: ${resourceName}`, { percentage: graded.percentage });
    }
```

Replace with:

```javascript
    if (user) {
      const passed = graded.percentage >= PASS_PERCENT;
      const certId = passed ? certificateId(user.id, graded.resource_name) : null;
      const { data, error } = await quizAttempts.insert({
        user_id: user.id,
        resource_name: graded.resource_name,
        score: graded.score,
        max_score: graded.max_score,
        percentage: graded.percentage,
        correct_count: graded.correct_count,
        wrong_count: graded.wrong_count,
        time_taken_s: graded.time_taken_s,
        status: 'completed',
        answers: graded.answers,
        // Single course certificates are auto-issued on pass (no admin approval).
        // In Supabase mode a DB trigger also enforces this; here we set it so the
        // localStorage mock behaves identically.
        cert_status: passed ? 'approved' : 'none',
        cert_id: certId,
      });
      if (error) {
        alert('Failed to save quiz attempt: ' + (error.message || JSON.stringify(error)));
      }
      if (data) {
        graded.id = data.id;
        graded.user_id = user.id;
        graded.cert_id = data.cert_id || certId;
        graded.cert_status = data.cert_status || (passed ? 'approved' : 'none');
      }
      await history.log(user.id, 'quiz', `Completed quiz: ${resourceName}`, { percentage: graded.percentage });

      // Auto-email the certificate PDF. Best-effort — never block the results
      // screen (offline/mock mode or a missing endpoint simply skips the email;
      // the certificate is already downloadable in-app).
      if (passed && data) {
        issueCertificate({ id: data.id, user_id: user.id, resource_name: graded.resource_name, cert_id: graded.cert_id })
          .catch(() => {});
      }
    }
```

- [ ] **Step 3: Verify build + functional (mock mode)**

Run: `npm run build`, then `npm run dev`. With no Supabase env configured (mock mode), sign up, take a quiz for **Sakana AI**, score ≥70%. On the results screen go to `/dashboard/certificates`.
Expected: the Sakana AI course certificate shows **Preview / PDF** immediately (no "Request Certificate" / "Pending"). Downloading the PDF works.

- [ ] **Step 4: Commit**

```bash
git add src/features/dashboard/pages/QuizRunner.jsx
git commit -m "feat: auto-issue and email single certificate on quiz pass"
```

---

## Task 11: Student cert pages — immediate download, remove request/pending UI

**Files:**
- Modify: `src/features/dashboard/pages/CertificatePage.jsx`
- Modify: `src/features/dashboard/pages/CertificatesPage.jsx`

- [ ] **Step 1: Remove the approval gate in `CertificatePage.jsx`**

Find (lines 78-89):

```javascript
  // New logic: Only display if approved
  if (cert.cert_status !== 'approved' && profile?.role !== 'admin') {
    return (
      <div className="dash-page">
        <div className="empty-state">
          <ShieldCheck size={40} />
          <p>Certificate is {cert.cert_status}.</p>
          <p className="dash-muted">Your certificate is currently pending admin approval.</p>
        </div>
      </div>
    );
  }

```

Delete this entire block (single course certificates no longer require approval; if a `cert` exists the user earned it). Leave the surrounding `if (!cert)` block above and `const onDownload` below intact.

- [ ] **Step 2: Verify no now-unused import breaks the build**

`ShieldCheck` is still imported on line 3 but no longer used after Step 1. Remove it from the import to satisfy `npm run lint` (max-warnings 0). Find on line 3:

```javascript
import { Download, Printer, ArrowLeft, ShieldCheck, Lock } from 'lucide-react';
```

Replace with:

```javascript
import { Download, Printer, ArrowLeft, Lock } from 'lucide-react';
```

- [ ] **Step 3: Simplify the course-cert card actions in `CertificatesPage.jsx`**

Find the course-cert actions block (lines 239-261):

```javascript
                  <div className="cert-card-actions">
                    {c.cert_status === 'approved' ? (
                      <>
                        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/dashboard/certificate/${encodeURIComponent(c.resourceName)}`)}><Eye size={14} /> Preview</button>
                        <button className="btn btn-outline btn-sm" disabled={busy === c.id} onClick={() => onDownload(c)}><Download size={14} /> {busy === c.id ? '…' : 'PDF'}</button>
                      </>
                    ) : c.cert_status === 'pending' ? (
                      <span className="dash-muted" style={{ fontSize: '0.85rem' }}>Pending Approval</span>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={async () => {
                        const certId = c.id || certificateId(user.id, c.resourceName);
                        const { error } = await quizAttempts.update(c.attemptId, { cert_status: 'pending', cert_id: certId });
                        if (error) {
                          console.error(error);
                          window.alert(`Failed to request certificate. Error: ${error.message || JSON.stringify(error)}`);
                        } else {
                          await reload();
                        }
                      }}>
                        Request Certificate
                      </button>
                    )}
                  </div>
```

Replace with (course certificates are always available once earned):

```javascript
                  <div className="cert-card-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => navigate(`/dashboard/certificate/${encodeURIComponent(c.resourceName)}`)}><Eye size={14} /> Preview</button>
                    <button className="btn btn-outline btn-sm" disabled={busy === c.id} onClick={() => onDownload(c)}><Download size={14} /> {busy === c.id ? '…' : 'PDF'}</button>
                  </div>
```

- [ ] **Step 4: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both pass. (`certificateId`, `quizAttempts`, `reload` are still used elsewhere in `CertificatesPage.jsx` — the module-cert flow — so no imports need removing there. `Eye`, `Download` still used.)

- [ ] **Step 5: Functional check**

In `npm run dev` (mock mode), pass a quiz → `/dashboard/certificates` shows course cert with Preview + PDF immediately; the certificate preview page opens without a "pending approval" screen.

- [ ] **Step 6: Commit**

```bash
git add src/features/dashboard/pages/CertificatePage.jsx src/features/dashboard/pages/CertificatesPage.jsx
git commit -m "feat: single certificates are downloadable immediately (no approval)"
```

---

## Task 12: Admin pages — drop single-cert approval; module approval emails the PDF

**Files:**
- Modify: `src/features/admin/pages/AdminLeaderboard.jsx`
- Modify: `src/features/admin/pages/AdminStudentProfile.jsx`

- [ ] **Step 1: Route module approval through the emailing endpoint (`AdminLeaderboard.jsx`)**

Find `setModuleStatus` (lines 132-142):

```javascript
  const setModuleStatus = async (a, cert_status) => {
    setBusy(`ws-${a.id}`);
    try {
      // Module certificates are delivered in-app (no emailed token link), so
      // approval is a direct status update rather than the /api approve flow.
      await quizAttempts.update(a.id, { cert_status });
    } finally {
      await load();
      setBusy(null);
    }
  };
```

Replace with:

```javascript
  const setModuleStatus = async (a, cert_status) => {
    setBusy(`ws-${a.id}`);
    try {
      if (cert_status === 'approved') {
        // Approving a module (consolidated) certificate now emails the student
        // the PDF via the serverless approve flow. Falls back to a local status
        // update in offline/mock mode.
        const slug = moduleCertSlug(a.resource_name);
        const label = slug ? moduleLabel(slug) : undefined;
        const result = await approveCertificate(a, { moduleLabel: label });
        if (result.emailed) {
          const u = userMap[a.user_id];
          window.alert(`Module certificate approved and emailed to ${result.to || u?.email || 'the student'}.`);
        } else if (result.link) {
          window.prompt('Approved. Email is unavailable — share this 24-hour download link:', result.link);
        }
      } else {
        await quizAttempts.update(a.id, { cert_status });
      }
    } catch (e) {
      window.alert(`Could not update the module certificate: ${e.message}`);
    } finally {
      await load();
      setBusy(null);
    }
  };
```

- [ ] **Step 2: Remove single-cert approve/reject; keep view/download/email (`AdminLeaderboard.jsx`)**

Single course certs are now auto-issued, so the admin table needs no approve/reject. Find the single-cert actions cell (lines 314-334):

```javascript
                    <td>
                      {status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-primary btn-sm" disabled={busy === a.id} onClick={() => handleApprove(a)}>Approve</button>
                          <button className="btn btn-outline btn-sm" disabled={busy === a.id} onClick={() => handleReject(a)}>Reject</button>
                        </div>
                      )}
                      {status === 'approved' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/admin/certificate/${a.user_id}/${encodeURIComponent(a.resource_name)}`)}>
                            <Eye size={14} /> View
                          </button>
                          <button className="btn btn-outline btn-sm" disabled={busy === 'dl-' + a.id} onClick={() => handleDownload(a, studentName)}>
                            <Download size={14} /> DL
                          </button>
                          <button className="btn btn-outline btn-sm" disabled={busy === 'rs-' + a.id} onClick={() => handleResend(a)} title="Email a fresh 24-hour download link to the student">
                            <Mail size={14} /> {busy === 'rs-' + a.id ? 'Sending…' : 'Resend link'}
                          </button>
                        </div>
                      )}
                    </td>
```

Replace with (every passing attempt is issued; offer View / Download / Email):

```javascript
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/admin/certificate/${a.user_id}/${encodeURIComponent(a.resource_name)}`)}>
                          <Eye size={14} /> View
                        </button>
                        <button className="btn btn-outline btn-sm" disabled={busy === 'dl-' + a.id} onClick={() => handleDownload(a, studentName)}>
                          <Download size={14} /> DL
                        </button>
                        <button className="btn btn-outline btn-sm" disabled={busy === 'rs-' + a.id} onClick={() => handleResend(a)} title="Email the certificate PDF to the student">
                          <Mail size={14} /> {busy === 'rs-' + a.id ? 'Sending…' : 'Email cert'}
                        </button>
                      </div>
                    </td>
```

- [ ] **Step 3: Repoint `handleResend` to `issueCertificate` and remove the now-unused `handleApprove`/`handleReject` (`AdminLeaderboard.jsx`)**

Replace `handleApprove` (lines 62-83), `handleResend` (lines 87-108), and `handleReject` (lines 110-116) with a single `handleResend` that emails the single-cert PDF:

```javascript
  // Re-send the certificate PDF to the student (single course certs are already
  // auto-issued; this just re-emails a fresh copy + a fresh 24h link).
  const handleResend = async (a) => {
    setBusy('rs-' + a.id);
    try {
      const u = userMap[a.user_id];
      const studentName = u?.full_name || u?.email || 'the student';
      const result = await issueCertificate(a);
      if (result.emailed) {
        window.alert(`Certificate emailed to ${result.to || studentName}.`);
      } else if (result.link) {
        window.prompt('Email unavailable — share this 24-hour download link:', result.link);
      } else {
        window.alert(`Could not email the certificate${result.error ? `: ${result.error}` : '.'}`);
      }
    } catch (e) {
      window.alert(`Could not email the certificate: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };
```

Then update the imports on line 6 from:

```javascript
import { approveCertificate } from '../../../lib/certificateApi';
```

to:

```javascript
import { approveCertificate, issueCertificate } from '../../../lib/certificateApi';
```

- [ ] **Step 4: Verify `AdminLeaderboard` build + lint**

Run: `npm run build && npm run lint`
Expected: pass. If lint flags an unused import (e.g. `Check`), remove only the genuinely unused names from the lucide-react import on line 3. (`approveCertificate` is still used by `setModuleStatus`; `X`, `Clock`, `ShieldCheck`, `Sparkles`, `Mail`, `Eye`, `Download`, `User`, `Award` remain in use.)

- [ ] **Step 5: Remove single-cert approve in `AdminStudentProfile.jsx`**

Find the Certificate History status + actions cells (lines 168-185):

```javascript
                        <td>
                          {status === 'approved' && <span className="badge-green">Approved</span>}
                          {status === 'pending' && <span className="badge-amber">Pending</span>}
                          {status === 'rejected' && <span className="badge-red">Rejected</span>}
                          {status === 'none' && <span className="dash-muted">No Request</span>}
                        </td>
                        <td>
                          {status === 'approved' && (
                            <button className="btn btn-outline btn-sm" disabled={busy === 'dl-' + a.id} onClick={() => handleDownload(a, studentName)}>
                              <Download size={14} /> DL
                            </button>
                          )}
                          {status === 'pending' && (
                            <button className="btn btn-primary btn-sm" disabled={busy === a.id} onClick={() => handleApprove(a)}>
                              Approve
                            </button>
                          )}
                        </td>
```

Replace with (course certs are always issued — show Issued + a Download button):

```javascript
                        <td>
                          <span className="badge-green">Issued</span>
                        </td>
                        <td>
                          <button className="btn btn-outline btn-sm" disabled={busy === 'dl-' + a.id} onClick={() => handleDownload(a, studentName)}>
                            <Download size={14} /> DL
                          </button>
                        </td>
```

- [ ] **Step 6: Remove the now-unused `handleApprove` + unused imports in `AdminStudentProfile.jsx`**

Delete the `handleApprove` function (the block starting `const handleApprove = async (a) => {` through its closing `};`, lines ~104-124). Then run `npm run lint` and remove any names it reports unused. Expected unused after this change: `approveCertificate` (from `certificateApi`), the local `status` variable inside the map (line 163 — remove the `const status = a.cert_status || 'none';` line since it is no longer referenced), and possibly lucide icons `ShieldCheck`/`Clock`/`Mail`/`Sparkles` if they were only used by removed code. Remove exactly what lint flags — do not remove names still in use elsewhere in the file.

- [ ] **Step 7: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both pass with zero warnings.

- [ ] **Step 8: Functional check (admin)**

In `npm run dev` (mock mode) as an admin (register with a `VITE_ADMIN_BOOTSTRAP_EMAILS` address, or use the mock admin), open `/admin/leaderboard`. Passing single attempts show View / DL / Email cert (no Approve/Reject). A module request (created from a student's Certificates page after passing every quiz in a module) still shows Approve/Reject; approving it succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/features/admin/pages/AdminLeaderboard.jsx src/features/admin/pages/AdminStudentProfile.jsx
git commit -m "feat: remove single-cert approval; module approval emails the PDF"
```

---

## Task 13: Full verification pass

- [ ] **Step 1: Lint + build clean**

Run: `npm run lint && npm run build`
Expected: no warnings, no errors, `dist/` produced.

- [ ] **Step 2: End-to-end functional checklist (mock mode — no Supabase env)**

Run `npm run dev` and confirm:
- [ ] `/dashboard/materials` lists **Sakana AI** and **GLM 5.2**; each opens a document view and a slides view.
- [ ] Taking either quiz and scoring **≥70%** marks it passed; **<70%** fails.
- [ ] After a pass, `/dashboard/certificates` shows the course certificate with **Preview + PDF** immediately (no request/pending step); the PDF downloads and renders (borders, signature, logo, QR, ID).
- [ ] Complete every quiz in the AI Tools module → the module card shows **Request Certificate**; requesting it appears under `/admin/leaderboard` → **Module Certificate Approvals**; admin **Approve** succeeds and the module PDF downloads.
- [ ] `/admin/leaderboard` single-cert rows show **View / DL / Email cert** and no Approve/Reject.

- [ ] **Step 3: Serverless smoke (optional, requires `vercel dev` + env)**

If Supabase + Resend env vars are set, run `vercel dev` and: pass a quiz → confirm the certificate email arrives with a **PDF attachment**; approve a module cert → confirm its email arrives with the module PDF. Without env, the app degrades gracefully (in-app download still works).

- [ ] **Step 4: Final grep sanity**

Run: `grep -rn ">= 80\|= 80;" src api supabase | grep -iv "width\|height\|px"`
Expected: no pass-threshold `80` remains anywhere.

- [ ] **Step 5: Confirm no stray commits / working tree clean**

Run: `git status`
Expected: clean tree; all tasks committed.

---

## Notes / risks carried from the spec

- **`jsPDF` + `qrcode` in the Vercel Node runtime:** both are isomorphic and imported statically in `api/_certificate-pdf.js`. If a bundling issue appears at deploy, switch the two imports to dynamic `await import(...)` inside the builder functions (as the client does).
- **Resend attachment format:** this plan passes `content: pdf.toString('base64')`. If Resend rejects it, pass the raw `Buffer` as `content` instead.
- **RLS:** `quiz_attempts` insert/update policies allow a user to write their own row's `cert_status` (no column restriction), so client-side auto-approve is permitted; the DB trigger is the authoritative backstop.
- **PDF layout parity:** `api/_certificate-pdf.js` mirrors `src/lib/certificates.js`. If the on-screen certificate design changes later, update both.
- **Category on emailed PDF:** the serverless single-cert PDF uses `categoryLabel: 'General'` (the DB has no category column on attempts). This is cosmetic; the in-app download still shows the true category.
