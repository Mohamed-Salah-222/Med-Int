# PRODUCT.md

_Canonical product definition. All agents read this before any work._
_If a request conflicts with this file, the file wins — ask, don't assume._

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
7. All chapters done → certificate of completion

Progression is strictly gated. No skipping ahead.

## What's in the product

**Now:** text lessons, lesson quizzes, chapter tests, progress tracking,
certificate of completion.

**Later:** audio practice and interpretation drills.

---

## Assessment integrity

The certificate is only worth what the testing is worth.

- **30 seconds per question, globally.** This is deliberate. An
  interpreter's core skill is reaction speed under live conditions.
  The timer is training, not just anti-cheat. All questions are
  recall-type; there are no long scenario questions.
- **Timer is authoritative server-side.** Server issues the question
  with a timestamp and judges the submission. Brief grace window on
  reconnect so network issues don't fail honest students.
- **Randomized question order,** drawn from a larger question bank.
- **Tab/focus loss is logged and flagged, never an instant fail.**
  Repeat offenses void the attempt and force a retake with a different
  question set.
- **Strictest controls on chapter tests and the final;** lighter on
  lesson quizzes.

Known limits: browsers cannot block screenshots, and copy-blocking is a
deterrent only. Integrity comes from question banks, timing, and
retakes — not from lockdown.

## Certificate

Certificate of **completion**, issued by us. Not a national
certification.

Market evidence says employers in this space accept this. It is
positioned honestly — never implied to be CCHI or NBCMI, and described
as preparation for those exams where relevant.

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

## Pricing

- Course: one-time payment
- Post-course services: recurring subscription
- Bundles: later, not v1

---

## Launch requirements

**Must have:** complete course material, lesson → quiz → progress flow,
auth, payment, certificate generation, working quiz integrity.

**Can wait:** audio practice, bundles.

## NOT building

- Mobile app
- Language pairs other than Arabic–English
- 1-on-1 coaching, live practice, live classes
- Community forum
- Any marketplace
- Human-graded assignments

Other ideas exist and are deliberately parked. Agents must not scope
them in.
