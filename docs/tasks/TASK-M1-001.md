# TASK-M1-001: Establish database backups

Implementer: Owner (manual)
Reviewer: none
Depends on: none
Status: ready

## Problem

Course content — lessons, chapters, question banks — exists only in
MongoDB with no backup. It is the core business asset and cannot be
regenerated. The current "backup" is chat histories in other AI
conversations, which is not a backup: wrong schema, deletable,
scattered, and weeks of work to reconstruct from.

Free-tier Atlas has no automated snapshots.

## Goal

A restorable copy of the database exists off-machine, and a routine
exists for keeping it current.

## Steps

1. Run a dump:
   mongodump --uri="$MONGODB_URI" --out=./backups/$(date +%F)
2. Verify it is not empty — check collection counts and file sizes
3. Copy the folder somewhere off this machine (Drive, external disk,
   anywhere that is not this laptop)
4. Add backups/ to .gitignore — dumps must never be committed, they
   contain student PII
5. Test the restore path once on a scratch database. An untested
   backup is not a backup.

## Acceptance criteria

- [ ] Dump produced and verified non-empty
- [ ] Copy stored off-machine, location recorded below
- [ ] backups/ gitignored
- [ ] Restore tested at least once
- [ ] A note in DECISIONS.md recording the backup routine and cadence

## Result

[record what you did and where the copy lives]
