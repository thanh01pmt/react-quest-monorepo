## ADDED Requirements

### Requirement: Submission History Retrieval
The system SHALL provide an API to retrieve a participant's submission history for a specific quest.

#### Scenario: Fetching History
- **WHEN** an authenticated participant requests their history for `quest_id` = "scratch-1".
- **THEN** the system SHALL return a list of their past submissions for that quest, including status, score, and timestamp.
- **AND** the system SHALL NOT return submissions belonging to other participants.
