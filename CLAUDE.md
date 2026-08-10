# Project Instructions — Claude Code

## Read before any significant work

1. docs/PRODUCT.md — what this product is. Canonical.
2. docs/CURRENT_STATE.md — where the code actually stands.
3. docs/ROADMAP.md — milestone order.
4. docs/DECISIONS.md — decisions already made. Do not relitigate.
5. docs/QUALITY_BAR.md — what "done" means here.

## Hard rules

- Work only from a task file in docs/tasks/. No task file, no code.
- Touch only files listed in the task's "Allowed to change".
- Never modify docs/PRODUCT.md. Flag conflicts to the owner instead.
- If code and PRODUCT.md disagree, STOP and ask. Do not pick a side.
- Do not scope in anything from PRODUCT.md's "NOT building" list.
- Whatever writes code does not approve it. Review comes from the
  other tool.
- Full test suite must pass before you call anything done.

## Stack

Backend: Node + TypeScript + Express + MongoDB/Mongoose (Back-End/)
Frontend: Vite + React 19 + TypeScript + Tailwind (Front-End/)

## Commits

Conventional commits: feat/fix/docs/refactor/test/chore
One line, imperative, under 70 chars.
