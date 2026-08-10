# Decisions

Append-only. Do not edit past entries. Do not relitigate.

## D-001: Empty chapters are denied, and cannot be published

Date: 2026-08-10
Decided by: Owner

Context: canAccessChapterTest denies access to a chapter with zero
lessons (accessController.ts:153-159). This is a deliberate guard.
But canAccessFinalExam requires passedChapterTests.length >=
totalChapters (accessController.ts:232), so one published empty
chapter permanently blocks every student from the final exam and
therefore from certificates. Nothing in the models prevents
publishing an empty chapter.

Decision: Keep the deny behavior. Additionally, block publishing a
chapter that has zero lessons. An empty chapter is an authoring
mistake, not a student state.

Consequence: A validation rule is required at chapter publish time.
Tracked as an M2 task.
