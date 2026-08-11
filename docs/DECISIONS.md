# Decisions

Append-only. Do not edit past entries. Do not relitigate.

## D-001: Empty chapters are denied, and cannot be published

Date: 2026-08-10
Decided by: Owner

Context: canAccessChapterTest denies access to a chapter with zero
lessons (accessController.ts:153-159). This is a deliberate guard.
But canAccessFinalExam requires passedChapterTests.length >=
totalChapters (accessController.ts:232), so one published empty
chapter permanently blocks every student from the final exam and
therefore from certificates. Nothing in the models prevents
publishing an empty chapter.

Decision: Keep the deny behavior. Additionally, block publishing a
chapter that has zero lessons. An empty chapter is an authoring
mistake, not a student state.

Consequence: A validation rule is required at chapter publish time.
Tracked as an M2 task.

## D-002: Access is role + entitlements array
Date: 2026-08-11
Decided by: Owner

Roles (what kind of account):
- User   — can see landing, product pages, course overview. No content.
- Student — has access to content. Which content is defined by
  entitlements.
- Admin  — full control: create, edit, delete, maintenance mode.

Entitlements (what the account has access to):
An array on the user, e.g. ["course", "audio", "notes", "post-course"].
Buying a product adds its entitlement. A Student sees exactly the
products in their array, nothing else.

Consequence: entitlements are written by the payment webhook, not set
manually by an admin. Access follows money automatically. This replaces
the current model where role alone grants access and an admin sets it
by hand (roleMiddleware.ts:19, adminController.ts:1111).

## D-003: SuperVisor role is removed
Date: 2026-08-11

An undocumented role with admin-level access exists in the codebase
(ProtectedRoute.tsx:28, Layout.tsx:79, Dashboard.tsx:13,
LessonSidebar.tsx:26, AdminUserDetail.tsx:463). The owner does not
recall creating it and it serves no known purpose.

Decision: remove SuperVisor entirely. Roles are User, Student, Admin
(see D-002). Any existing SuperVisor accounts are migrated to Admin.

## D-004: Landing page states
Date: 2026-08-11

Four states, one page:

- Anonymous: full landing. Course-led — the course occupies most
  panels, other products appear at the bottom. Primary CTA: enroll.
- Logged in, owns nothing: same full page, plus a persistent purchase
  bar with price and buy button. This visitor is the furthest down the
  funnel and the page's job is to remove friction, not re-explain the
  product. No promo/bundle banner at launch — there are no offers yet.
- Logged in, owns something: top section becomes "Continue where you
  left off" linking directly to their next action. Below that, only
  products they do NOT own. Never sell something already owned.
- Admin: same as any other state, plus preview mode (D-005).

## D-005: Admin preview mode
Date: 2026-08-11

Admins can render the UI as if they were anonymous, logged-in-with-
nothing, or logged-in-with-entitlements, via a floating control.

Rules:
- Display only. It never changes what the API grants. The admin's real
  token retains admin access at all times. Client-side entitlement
  faking must not be mirrored server-side.
- The control is persistently and unmistakably visible while active.

Not launch-blocking. Built after checkout works.

## D-006: Purchase requires a verified account
Date: 2026-08-11

Anonymous users clicking Enroll go to /register, verify email, then
checkout. Account creation is not folded into the checkout flow.

Accepted tradeoff: this loses some buyers at the verification step.
Chosen for simplicity and because it matches the existing auth flow.

## D-007: /products catalog
Date: 2026-08-11

Four cards on the catalog page:

1. Course — one-time purchase. Live at launch.
2. Audio Practice — one-time purchase. Card visible with "Coming
   soon"; not buyable at launch (recording takes time).
3. Note-Taking Material — free. Button reads "Get it free", not "Buy".
   No checkout, no entitlement, no purchase record — gated on having
   an account only. Sourced from open-source material; license must be
   verified as permitting commercial redistribution before launch.
4. Post-Course Services — monthly subscription, two tiers.

Owned products render greyed out and labelled "Owned".

Bundles and multi-product discounts are post-launch, not v1.

## D-008: Post-course subscription
Date: 2026-08-11

Two tiers, monthly billing only. No annual option at launch.

- Tier 1: CV training + job postings feed + HR outreach email templates
- Tier 2: everything in Tier 1, plus we write the CV and prepare the
  application emails. The student sends them (see PRODUCT.md — we never
  hold student credentials).

Mechanics:
- Cancellation: access continues until the end of the paid period.
- Does NOT require owning the course. Anyone can subscribe.
- Tier switching allowed mid-cycle; upgrading requires paying the
  difference.

## D-009: Promo codes are launch-blocking
Date: 2026-08-11

Required before Paymob goes live — retrofitting discounts into a live
payment flow is worse than building it in.

Minimum system: code, discount type (percent or fixed), value, expiry
date, max total uses, max uses per user, and which products it applies
to.