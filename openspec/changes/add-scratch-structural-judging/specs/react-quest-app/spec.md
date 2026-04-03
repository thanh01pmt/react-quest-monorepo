# Modified Requirements: react-quest-app

## MODIFIED Requirements
### Requirement: Asynchronous Updates
The client SHALL pull the submission status until a final `status` (such as `accepted`, `wrong`, `error`) is reached.

#### Scenario: Polling termination
- **WHEN** the server returns `status === 'accepted'`.
- **THEN** the client SHALL stop polling immediately.
