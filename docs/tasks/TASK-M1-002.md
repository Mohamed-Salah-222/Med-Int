# TASK-M1-002: Nightly content export to the repository

Implementer: Codex
Reviewer: Claude Code
Depends on: TASK-M1-001
Status: ready

## Problem

Course content lives only in MongoDB. There is no version-controlled,
diffable copy. A database restore recovers data but shows no history —
you cannot see what a lesson said last week or when a question changed.

Database dumps (M1-001) protect against loss. This protects against
silent corruption and gives content a history.

## Goal

A script exports course content to JSON in the repository, runnable on
demand and schedulable.

## Allowed to change

Back-End/src/scripts/exportContent.ts (new)
Back-End/package.json (scripts entry only)
.gitignore
docs/tasks/TASK-M1-002.md

## Must NOT change

Any controller, model, route, or frontend file.

## Requirements

- Exports courses, chapters, lessons, and questions to
  content/\*.json at the repository root — one file per collection
- Deterministic output: stable key order, stable document order,
  pretty-printed. Two runs against an unchanged database must produce
  byte-identical files, otherwise every run shows a spurious diff.
- Excludes all user data. No users, no progress, no test sessions, no
  certificates, no orders. This directory is committed and must never
  contain student PII.
- Read-only against the database
- Exits non-zero on failure

## Acceptance criteria

- [ ] npm run export:content produces content/\*.json
- [ ] Running twice with no DB change yields an identical diff (verify
      with git status)
- [ ] No user, progress, session, or certificate data in the output
- [ ] Script fails loudly if MONGODB_URI is missing
- [ ] Tests cover: deterministic ordering, and that excluded
      collections are absent from the output

## Discovered

## Review
