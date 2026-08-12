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

- User — can see landing, product pages, course overview. No content.
- Student — has access to content. Which content is defined by
  entitlements.
- Admin — full control: create, edit, delete, maintenance mode.

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

## D-010: /products/course — course detail page

Date: 2026-08-11

Moves from /course to /products/course. Every product gets a detail
page under /products/:slug. Redirect /course → /products/course to
preserve existing links.

Content (current page is largely correct and stays):

- Course summary
- Curriculum: chapter titles only. Lesson titles are NOT shown to
  non-buyers — enough to gauge value, not enough to copy the outline.
- Career/salary context cards
- Post-course services mention
- Enrollment CTA

States:

- Anonymous → CTA goes to /register (D-006)
- Logged in, doesn't own → CTA goes to checkout
- Owns it → page renders with an "Owned" banner at the top and a
  prominent "Go to dashboard" button. No redirect. The sales page
  stays reachable and shareable.
- Admin → same as any state, per preview mode (D-005)

## D-011: Registration and email verification

Date: 2026-08-11

Registration collects name, email, password. No additional fields.

Intent carrying: when a user reaches /register from a product page,
the intended product is stored and carried through verification. After
verifying, they land on that product's checkout rather than a generic
page. If no intent was set, they land on /products.

This directly mitigates the conversion loss accepted in D-006.

Email verification stays a typed code, not a click-a-link. A link
opens in whatever browser the mail client chooses — often not the one
holding the session, and often a different device. That loses the
stored product intent and lands the user without a session. The typed
code keeps the user in the original tab with session and intent
intact.

## D-012: Checkout flow

Date: 2026-08-11

One product at a time. No cart — four products, two buyable at launch,
one free. A cart is machinery with no buyer. Bundles, when they come,
are just another product.

Single page at /checkout, three sections:

1. What you're buying, and the price
2. Promo code field — applies inline, updates the total in place
3. Pay button

Currency: EGP. Buyers are Egyptian; ads target Egypt. No multi-currency
handling at launch.

## D-013: Paymob integration — hosted redirect

Date: 2026-08-11

The user is redirected to Paymob's hosted payment page and returns
after. Card details never reach our server, which removes essentially
all PCI scope. Embedded checkout looks better, costs significantly more
work and risk, and is not worth it for a first launch.

Entitlements are granted by the WEBHOOK, never by the success redirect.
The redirect is only the user's browser: it can be forged, lost when a
tab closes, or fire before the payment settles.

- Webhook verifies the signature, grants the entitlement, and is
  idempotent — providers retry.
- The success page READS state, never creates it. If the webhook has
  not landed yet, it polls and shows "confirming your payment".
- Subscriptions produce recurring webhooks. A renewal extends access;
  a failed renewal ends access at the end of the paid period.

Order records are written for every attempt — pending, paid, failed.
Required for /account/purchases, /admin/orders, and for answering
"I paid and got nothing".

## D-014: Checkout outcome pages

Date: 2026-08-11

/checkout/success — a receipt, not the content. Order number, what was
bought, amount paid, and a prominent button into the product. People
need proof the money went somewhere before they trust the site.

/checkout/failed — its own page, not checkout with a red banner. Shows
Paymob's reason where one is given, plus a retry button. Returning
someone to a form with an error reads like the site broke.

## D-015: Refund policy

Date: 2026-08-11

One-time products: full refund within 48 hours of purchase, no
questions asked, provided the final exam has not been passed.

The only thing a refund actually costs is an issued certificate — that
is the asset. Reading lessons costs nothing marginal. An earlier draft
tied refunds to chapters consumed; that was dropped because "consumed"
invites disputes with an already-unhappy buyer, and "no questions
asked" is a stronger line on a sales page.

Subscriptions: monthly, no refunds, no partial months. Cancel anytime,
access continues to the end of the paid period (D-008).

OPEN: Egyptian consumer protection law may mandate a distance-selling
return window for digital goods. A policy more restrictive than the law
is unenforceable. Confirm with a local lawyer before publishing.

## D-016: /account

Date: 2026-08-11

Sections:

- Profile: name (editable). Email display-only — changing it requires
  re-verification, out of scope for v1. Change password (current + new
  - confirm).
- Your access: read-only list of owned entitlements — course,
  subscription tier, audio practice when it exists.
- Subscription: current tier, next billing date, switch tier, cancel.
  Cancelling shows "access until [date]" per D-008, framed as
  information rather than a warning.
- Danger zone: delete account.

Account deletion: anonymize the user record, preserve order records.
Egypt's Personal Data Protection Law grants deletion rights; tax and
accounting obligations require financial records to survive. Issued
certificates REMAIN VERIFIABLE after deletion — employers verify them,
and deleting an account must not invalidate someone's credential.

Email is permanent in v1. Accepted cost: a user who mistypes their
email at registration has no self-service fix.

## D-017: /account/purchases

Date: 2026-08-11

List of all orders: date, product, amount, status, order number.
Failed and pending attempts are shown, not hidden — someone who
believes they paid needs to see what actually happened. Receipt link
per order.

OPEN: Egyptian e-invoicing obligations. If the business is registered
(and Paymob approval will require some form of registration), compliant
tax invoices may be required rather than simple receipts. Confirm
during Paymob onboarding — building receipts and retrofitting invoices
later is more work than knowing up front.
