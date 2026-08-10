# TASK-M0-001: Verify .env history and rotate leaked secrets

Implementer: Owner (you, manually)
Reviewer: none
Depends on: none
Status: Done

## Problem

Back-End/.env contains live-looking credentials for Cloudinary, Google
OAuth, JWT/session, Mailtrap, MongoDB, and OpenAI (Back-End/.env:2-15).
The audit confirmed it is gitignored and untracked NOW, but checked
only the current index — not full history.

## Goal

Certainty about whether secrets ever entered git history, and rotated
keys if they did.

## Steps

git log --all --full-history -- Back-End/.env
git log --all --full-history -- Front-End/.env
git log -p --all -S "MONGODB_URI" | head -50

## Acceptance criteria

- [D] All three commands run, output recorded here
- [D] If Back-End/.env appears in ANY commit: every key in it rotated
- [D] Front-End/.env removed from tracking (git rm --cached) and
      gitignored, even though it holds only VITE\_ public values
- [D] .env.example created for both apps with keys, no values

## Result

[No Back-End/.env in git history — nothing to rotate.
Front-End/.env appeared in 3 commits, contained only public VITE_
values (course ID, localhost API URL, localhost OAuth URL).
No rotation required. Untracked and gitignored.]
