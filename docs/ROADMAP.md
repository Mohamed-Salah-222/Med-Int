# ROADMAP.md

_Milestones, not tasks. Task files are generated one milestone at a
time, from docs/CURRENT_STATE.md and this file._
_M0 → M4 must happen in order. M5/M6 may overlap. M7 gates on M6._

---

## M0 — Stabilize (blocks everything)

Nothing else starts until the suite is green. Without it, agents have
no signal and regressions merge silently.

- Verify .env history; rotate any leaked keys
- Fix backend test suite (getFinalExam import, accessController)
- Fix frontend test suite (51 failures, GOOGLE_OAUTH_URL mock)
- Add CI: tests must pass before merge

**Exit:** green suite, CI enforcing it.

## M1 — Data safety

Course content is the core business asset and currently has no backup.

- Mongo backup routine (mongodump before every milestone, off-machine)
- Nightly content export to content/\*.json, committed

**Exit:** course content survives a database loss.

## M2 — Correctness of the core gate

- Fix score fields: store percentages, name them honestly, migrate
- Verify the 80% unlock works end to end
- Fix accessController chapterNumber lookup (accessController.ts:72)
- Fix canAccessFinalExam missing course filter (accessController.ts:226)
- Resolve backward navigation to already-passed chapters
- Remove duplicate /:id/submit-exam route (courseRoutes.ts:28, :38)

**Exit:** progression provably correct, with tests.

## M3 — Close the content leak

Locked lessons are currently fetchable by any logged-in student.

- getLesson enforces progression server-side
- Same for quiz question endpoints
- Frontend checks access before fetching content
- Retire /api/access/\* duplication or make it the single gate
- Sanitize lesson HTML before dangerouslySetInnerHTML

**Exit:** locked content cannot be fetched by a logged-in student.

## M4 — Assessment integrity

The certificate is the product thesis. This is where it becomes real.

- 30s/question, server-authoritative; expiresAt checked at submit
- Reconnect grace window
- Focus-loss logged and flagged, not instant fail
- Void-and-retake on repeat offenses
- Question bank randomization
- Centralize pass threshold (80%) — one source of truth

**Exit:** certificate means something.

## M5 — Reconcile docs and code

- Write ARCHITECTURE.md and DECISIONS.md
- Delete legacy getChapterTest (courseController.ts:866)
- Fix READMEs (Front-End is still the Vite template; React version wrong)

**Exit:** docs describe reality.

## M6 — Complete the experience

Paymob requires a fully working site before granting credentials.

- Build /purchase page (no payment yet)
- UI consistency pass (final exam purple vs teal/navy elsewhere)
- Error and loading states
- Certificate generation verified end to end

**Exit:** fully working site, demo-able to Paymob.

## M7 — Paymob

- Full security review before submission
- Submit for approval (7–10 day wait — do content work during it)
- Integrate; entitlement from verified payment, not manual role
- Webhook handling and failure cases

**Exit:** real money, real access.

## M8 — Post-launch

- Lesson chatbot (server-side rate limit, scoped to lesson content)
- Audio practice
- Post-course subscription tiers
