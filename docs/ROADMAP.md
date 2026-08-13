ROADMAP.md

Milestones, not tasks. Task files are generated one milestone at a time from docs/CURRENT_STATE.md, docs/DECISIONS.md, and this file.

Supersedes the previous roadmap entirely. That version predated the page-by-page walkthrough and assumed the existing test suites were worth repairing.

Ordering rules

M1 → M4 must happen in order. M5 and M6 may overlap. M7 gates on M6 being genuinely done. M8 gates on Paymob approval, which cannot start until M7 produces a working site.

M1 — Data safety and baseline

Course content lives only in MongoDB with no backup. It is the core business asset and cannot be regenerated. Nothing else matters if it is lost.

mongodump routine, run before every milestone, stored off-machine
Nightly content export to content/*.json, committed to the repo
Verify no secrets in git history (done — TASK-M0-001, clean)

Exit: course content survives a database loss.

M2 — Specification and test replacement

The existing test suites encode what the code does, not what it should do. They were repaired in M0-002 and M0-003 to pass; that made them green without making them meaningful. They are not a specification and must not be treated as one.

Write docs/SPEC.md per area from DECISIONS.md — the real acceptance criteria, derived from the owner, not from the code
Delete the existing backend and frontend test suites
Write new tests from SPEC.md. Every progression gate needs a pass case and a fail case.
Add CI: typecheck plus tests on push and pull request

Expect the new suite to fail against current code. That is the point — those failures are the real defect list.

Exit: a test suite that describes intended behaviour, running in CI.

M3 — Correctness of the core gate

Progression is the product. Everything downstream — the certificate, the integrity story, the pitch — rests on it working.

Fix score fields: store percentages, name them honestly, migrate existing records (courseController.ts:360, :1049, :1457)
Fix accessController chapterNumber lookup (:72)
Fix canAccessFinalExam missing course filter (:226)
Remove duplicate /:id/submit-exam route (courseRoutes.ts:28, :38)
Block publishing a chapter with zero lessons (D-001)
Centralise the 80% pass threshold — one source of truth
Backward navigation to already-passed chapters: allowed, and a retake never lowers a recorded passing score

Exit: progression provably correct, verified by M2's tests.

M4 — Close the content leak

Locked lesson content is currently fetchable by any logged-in student. This defeats gating and every integrity measure built on top of it.

getLesson enforces progression server-side (courseController.ts:153)
Quiz question endpoints enforce the same (:207)
Frontend checks access before fetching content (LessonView.tsx:30, :44)
Retire /api/access/* duplication, or make it the single gate
Sanitise lesson HTML before dangerouslySetInnerHTML (LessonView.tsx:162)

Exit: locked content cannot be fetched by any student who has not earned it.

M5 — Roles, entitlements, and cleanup

Access is currently a role an admin sets by hand, with no link to a payment. This blocks the entire product catalogue.

Implement entitlements (D-002): role stays User / Student / Admin, plus an array of what the account has access to
Remove the SuperVisor role entirely; migrate any existing accounts to Admin (D-003)
Replace every hasCourseAccess role check with an entitlement check — Landing, CourseDetail, Dashboard at minimum
Remove the lesson chatbot: component, endpoint, and the openai dependency if nothing else uses it (D-021)
Delete legacy getChapterTest (courseController.ts:866)
Write docs/ARCHITECTURE.md; fix both READMEs

Exit: access is data, not a role flag, and the dead code is gone.

M6 — Assessment integrity

The certificate is the product thesis. This is where it becomes real.

Timer authoritative server-side; expiresAt checked at submit (currently unchecked — courseController.ts:1388–1401)
Reconnect grace window
Focus loss logged and flagged, never an instant fail — replaces the current immediate abandon (ChapterTestView.tsx:106, FinalExamView.tsx:130)
Void-and-retake with a different question set on repeat offences
Question bank randomisation
60 seconds per question globally, confirmed correct across lesson quizzes, chapter tests, and the final exam

Exit: the certificate means something.

M7 — The missing pages

Eleven pages that do not exist. Five links already point at a dead /purchase route.

Catalogue

/products — four cards: course, audio practice (coming soon, with notify-me capture), note-taking material (free), post-course services (D-007)
/products/:slug — product detail. /course moves to /products/course with a redirect (D-010)
* — 404 page (none currently exists)
/refund-policy (D-015)

Checkout

/checkout — one product at a time, promo code inline (D-012)
/checkout/success — a receipt, not the content (D-014)
/checkout/failed — its own page (D-014)
Promo code system: code, type, value, expiry, max uses, per-user limit, applicable products (D-009)

Account

/account — profile, password, entitlements, subscription management, delete account (D-016)
/account/purchases — order history including failed and pending (D-017)

Admin

/admin/products — products as data, not code (D-018)
/admin/orders — orders, webhook history, manual entitlement grant (D-019)

Dashboard

Rebuild as entitlement-driven blocks; continue-card as the primary element (D-020)

Exit: a complete site with no dead routes. Demo-able to Paymob.

M8 — Design system

Applied after the pages exist. Designing first and then adding eleven pages guarantees drift.

Implement tokens from D-023: palette, type scale, spacing scale, radii, borders
Remove every gradient
Resolve the purple final-exam theme against the rest of the app
Apply across all pages; landing layout retained at 90–100%, auth page structure retained with colours replaced
Replace stock imagery that reads as generic or AI-generated

Exit: one coherent system, applied everywhere.

M9 — Paymob
Full security review before submission
Submit for approval — 7 to 10 day wait. Use it for content work.
Hosted redirect integration (D-013)
Webhook grants entitlements, signature verified, idempotent
Failed-webhook alerting by email; stuck-pending order detection
Confirm during onboarding: e-invoicing obligations (D-017), whether API-initiated refunds are supported (D-019), and the legally required distance-selling return window (D-015)

Exit: real money, real access.

M10 — Launch readiness
Deployment: currently local-only, no CI/CD, no hosting defined
Admin preview mode (D-005)
Error and loading states across all pages
Certificate generation verified end to end
Dependency updates

Exit: live.

Post-launch
Audio practice product and its content
Bundles and multi-product discounts
Annual subscription billing
Self-service email change
A properly scoped, lesson-grounded assistant, if ever