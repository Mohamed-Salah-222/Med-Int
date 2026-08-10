# PRODUCT.md

_Canonical product definition. All agents read this before any work._
_If code conflicts with this file, ask the owner — do not "fix" either
side unilaterally._

---

## One line

A self-paced online course that takes an English-fluent beginner to
job-ready as a medical interpreter, with post-course support to
actually land the work.

## Who it's for

- Beginners entering medical interpretation. No experience assumed.
- English C1+ required, high B2 minimum. All instruction is in English.
- Arabic–English focus first. Other language pairs are out of scope.
- People who intend to get hired, not hobbyists.

## Why this exists

The dominant existing course in this space (Ibn Sina) has real gaps —
the founder took it and hit them firsthand. This course fills them.

More importantly: hiring in this field runs on assessment + quiz +
proof of course completion. The founder was hired by three US companies
with zero interviews at any of them. No CCHI, no NBCMI. What mattered
was being well trained and holding a credible certificate.

That is the product thesis: a course rigorous enough that its
certificate carries weight, plus concrete help getting through the door.

---

## What a student does

1. Log in → dashboard
2. Open next lesson (text)
3. Finish lesson → lesson quiz
4. Score ≥80% → next lesson unlocks
5. All lessons in chapter done → chapter test
6. Pass chapter test → next chapter unlocks
7. All chapters passed → **final exam**
8. Pass final exam → certificates issued

Progression is strictly gated at every step. No skipping ahead.

Admins bypass all gates. This is intentional, for testing.

## What's in the product

**Now:** text lessons, lesson quizzes, chapter tests, final exam,
progress tracking, certificate generation, admin content management.

**Later:** per-lesson chatbot, audio practice, post-course subscription
services.

---

## Authentication

Email/password registration with verification and password reset, plus
Google OAuth. JWTs carry a tokenVersion so sessions can be invalidated
server-side on role change.

Access to course content is granted by entitlement, not by manual role
assignment. (Currently role-based — see ROADMAP M7.)

---

## Assessment integrity

The certificate is only worth what the testing is worth.

- **60 seconds per question, globally.** Applies to lesson quizzes,
  chapter tests, and the final exam alike. Deliberate: an interpreter's
  core skill is reaction speed under live conditions. The timer is
  training, not just anti-cheat. All questions are recall-type MCQs.
- **Timing is authoritative server-side.** The server issues questions
  with a timestamp and validates expiry at submission. A brief grace
  window on reconnect prevents network issues failing honest students.
- **Randomized question order,** drawn from a larger question bank.
- **Focus loss is logged and flagged, never an instant fail.** Repeat
  offenses void the attempt and force a retake with a different
  question set.
- **Pass threshold is 80%** and is defined in exactly one place.
- **Strictest controls on chapter tests and the final exam;** lighter
  on lesson quizzes.

Known limits: browsers cannot block screenshots, and copy-blocking is a
deterrent only. Integrity comes from question banks, timing, and
retakes — not from lockdown.

## Certificates

Two certificates, both issued after passing the final exam:

1. **Medical Interpreter — certificate of completion**
2. **HIPAA training — certificate of completion**

Both are issued by us. Neither is a national certification. Market
evidence says employers in this space accept certificates of
completion; HIPAA training is a standard industry requirement and is a
real asset to an applicant.

Positioned honestly — never implied to be CCHI or NBCMI, and described
as preparation for those exams where relevant.

Certificates are publicly verifiable by certificate number plus
verification code.

---

## Post-course services (subscription)

**Tier 1**

- CV training: how to build a proper interpreter CV
- Job postings feed (Discord or on-site — undecided)
- HR outreach email templates

**Tier 2**

- We write the CV for the student
- Done-for-you applications: we prepare the application, the email, and
  the target list. **The student sends it.** We never hold student
  account credentials.

## Lesson chatbot (post-launch)

A per-lesson assistant for follow-up questions.

- 15 messages per lesson per user, **enforced server-side**
- Per-message length cap
- **Scoped to the lesson's content.** It must not answer general
  clinical or medical questions. This is a training product, not a
  medical reference.

## Pricing and payment

- Course: one-time payment
- Post-course services: recurring subscription
- Bundles: later, not v1
- **Provider: Paymob.** Paymob requires a fully working site before
  granting payment credentials, with a 7–10 day approval window. This
  makes payment integration the last build milestone, not the first.

---

## Content ownership

Course material, question banks, and lesson content are authored by the
owner and live in MongoDB, managed through the admin interface. This
content is the core asset of the business and must be backed up
independently of the running database.

---

## Launch requirements

**Must have:** complete course material, lesson → quiz → progress flow,
auth, certificate generation, working assessment integrity, purchase
flow, Paymob integration.

**Can wait:** chatbot, audio practice, post-course subscription tiers,
bundles.

## NOT building

- Mobile app
- Language pairs other than Arabic–English
- 1-on-1 coaching, live practice, live classes
- Community forum
- Any marketplace
- Human-graded assignments

Other ideas exist and are deliberately parked. Agents must not scope
them in.
