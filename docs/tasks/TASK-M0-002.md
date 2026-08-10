# TASK-M0-002: Repair backend test suite

Implementer: Codex
Reviewer: Claude Code
Depends on: none
Status: Done

## Problem

2 of 11 backend Jest suites fail before running:

- **tests**/courseController.test.ts:2 imports getFinalExam, which no
  longer exists (TS2305)
- **tests**/accessController.test.ts has 4 expectations failing against
  current behavior

## Goal

Backend suite runs green.

## Allowed to change

Back-End/src/**tests**/courseController.test.ts
Back-End/src/**tests**/accessController.test.ts

## Must NOT change

Any file in Back-End/src/controllers/
Any file in Back-End/src/models/
Anything in Front-End/

## Critical instruction

This task fixes TESTS, not source code.

For each of the 4 accessController failures, decide which is true:
(a) the test asserts old behavior and should be updated, or
(b) the test is right and the SOURCE is buggy.

If (b): do NOT fix the source. Document it under Discovered, mark the
test .skip with a comment linking to this task, and report it. Two of
those failures may relate to known bugs — the chapterNumber lookup
(accessController.ts:72) and the missing course filter in
canAccessFinalExam (accessController.ts:226). Those are M2 work.

## Acceptance criteria

- [ ] npm test runs with zero suite-level import errors
- [ ] Every remaining failure is either fixed or explicitly skipped
      with a comment
- [ ] For each of the 4 failures, a one-line verdict: test wrong or
      source wrong
- [ ] No source files modified

## Discovered

## Review
