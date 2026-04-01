## ADDED Requirements
### Requirement: View Submissions List
The system SHALL display a list of all past submissions for the current participant in the contest lobby (EntrancePage).

#### Scenario: Display Submissions
- **WHEN** the participant is logged in and is in the lobby.
- **THEN** the system fetches and displays a table of submissions including: Quest Title, Score, Submission Time, and Action.

### Requirement: Review Submission
The system SHALL allow participants to review a specific submission in a read-only QuestPlayer.

#### Scenario: Navigate to Review
- **WHEN** the participant clicks the "Review" link for a submission.
- **THEN** the system navigates to the review page and displays the submitted code/blocks in a read-only QuestPlayer.
