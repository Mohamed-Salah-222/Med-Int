# TASK-M0-004: Add CI

Implementer: Codex
Reviewer: Claude Code
Depends on: TASK-M0-002, TASK-M0-003
Status: ready

## Problem

No CI. With agents writing code, regressions merge unnoticed.

## Goal

Tests run automatically on push and PR, and failure is visible.

## Allowed to change

.github/workflows/ci.yml (new)
Back-End/package.json (scripts only)
Front-End/package.json (scripts only)

## Must NOT change

Any source or test file.

## Acceptance criteria

- [ ] Workflow runs on push to main and on pull_request
- [ ] Two jobs: backend (Jest) and frontend (Vitest)
- [ ] Both run typecheck before tests
- [ ] Node version pinned, matching local
- [ ] No secrets required to run
- [ ] Verified green on a real push

## Discovered

## Review
