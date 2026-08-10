# Quality Bar

## Definition of Done

A task is done when ALL are true:

- [ ] Every acceptance criterion checked off
- [ ] Full test suite green (backend + frontend)
- [ ] New behavior has tests. Bug fixes have a regression test.
- [ ] No files changed outside the task's allowed list
- [ ] Reviewed by the tool that did NOT write it
- [ ] Review findings resolved or explicitly accepted by the owner

The implementing agent does not decide it is done.

## Non-negotiables

- Authorization is enforced server-side. UI gating is not security.
- No secrets in code or in commits.
- Business constants (80% pass, 30s timer) live in ONE place.
- User input is validated server-side.
- No `any` in new TypeScript without a comment explaining why.

## Testing

- Backend: Jest. Frontend: Vitest.
- Test behavior, not implementation.
- Every progression gate needs a pass case AND a fail case.

## When blocked

Stop and ask. Do not guess at product intent, invent requirements,
or expand scope to "fix things while I'm here."
