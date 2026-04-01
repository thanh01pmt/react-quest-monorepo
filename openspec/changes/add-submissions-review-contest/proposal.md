# Change: Add Submissions List and Review to Contest Lobby

## Why
Participants in a contest currently cannot see their history of submissions for each challenge or review the specific solution they previously submitted. Providing this history increases transparency and allows for post-exam review.

## What Changes
- **EntrancePage**: Add a "History" section to the contest lobby if a participant is logged in.
- **SupabaseContestService**: Add `getSubmissionById` to fetch full details of a specific submission.
- **ResultReviewPage**: Implement/Fix the review page to load a submission and display it in a read-only `QuestPlayer`.
- **Routing**: Add the review route to `App.tsx`.

## Impact
- Specs: `contest-review` (New)
- Code: `App.tsx`, `EntrancePage/index.tsx`, `ResultReviewPage.tsx`, `SupabaseContestService.ts`.
