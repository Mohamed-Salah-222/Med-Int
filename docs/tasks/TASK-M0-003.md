# TASK-M0-003: Repair frontend test suite

Implementer: Codex
Reviewer: Claude Code
Depends on: TASK-M0-002
Status: ready

## Problem

Vitest: 7 failed files, 51 failed tests, 1 unhandled error.
Known cause: Register.test.tsx mocks the API module without
GOOGLE_OAUTH_URL, which Register.tsx:52 uses.
Remaining 6 files uninvestigated.

## Goal

Frontend suite runs green.

## Allowed to change

Front-End/src/**/\*.test.tsx
Front-End/src/**/\*.test.ts
Front-End/src/test-setup.ts (or equivalent)
Front-End/vitest.config.ts

## Must NOT change

Any non-test file under Front-End/src/
Anything in Back-End/

## Critical instruction

Same rule as M0-002: fix tests, not source. If a test is correct and
the component is broken, skip the test with a comment and log it under
Discovered. Do not fix components in this task.

Start by grouping the 51 failures by root cause. There are likely
3-5 real causes, not 51.

## Acceptance criteria

- [ ] Failures grouped by root cause, listed here
- [ ] npx vitest run exits 0
- [ ] Every skip has a comment explaining why
- [ ] No non-test source files modified

## Discovered

## Review
