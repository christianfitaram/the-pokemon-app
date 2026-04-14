# PR Narrative Guide

Use this guide to keep pull requests readable for reviewers and future maintainers.

## Required PR Structure

Every PR should answer these sections clearly:

1. `Problem`
2. `Approach`
3. `User impact`
4. `Risk`
5. `Test evidence`
6. `Screenshots`
7. `Rollback`

## Feature PR Example

`Problem`  
Users could not confirm whether chat responses were still streaming or stalled.

`Approach`  
Added a visible typing indicator state and a timeout fallback in the chat UI. Kept API contract unchanged.

`User impact`  
Users now get immediate feedback during long responses and lower perceived latency.

`Risk`  
Low. UI-only state transition update; no backend schema changes.

`Test evidence`  
`npm run lint`  
`npm run typecheck`  
`npm test -- --runInBand`  
Manual: start chat, confirm typing indicator appears and clears.

`Screenshots`  
Before/after chat view in loading state.

`Rollback`  
Revert `components/chat/UnifiedChat.tsx` changes and remove added test if any.

## Bugfix PR Example

`Problem`  
E2E tests failed intermittently because Cypress could not locate the search input.

`Approach`  
Stabilized selector contract using `data-testid="search-input"` and aligned test assertions with rendered DOM.

`User impact`  
No direct UX change; improves release confidence.

`Risk`  
Low. Selector attribute addition and test-only updates.

`Test evidence`  
`npm run test:e2e`  
`npm test -- --runInBand`

`Screenshots`  
Passing Cypress run summary.

`Rollback`  
Revert selector/test changes in the same PR.

## Refactor PR Example

`Problem`  
Rate-limit behavior had duplicated fallback logic spread across route handlers.

`Approach`  
Centralized shared behavior in `lib/security/rateLimit.ts` and `lib/security/localRateLimit.ts`.

`User impact`  
No feature change, but improved consistency and maintainability.

`Risk`  
Medium. Touches request-throttling path.

`Test evidence`  
Regression tests covering origin + rate-limit behavior and endpoint smoke tests.

`Screenshots`  
N/A (backend change). Include logs/terminal output snippet.

`Rollback`  
Restore previous rate-limit helper implementation.

## Narrative Quality Checklist

- Problem is specific and user/system observable.
- Approach explains why, not only what changed.
- Risk section names real failure modes.
- Test evidence includes exact commands run.
- Screenshots or logs prove behavior for reviewers.
