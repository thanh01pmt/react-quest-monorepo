# contest-judge Specification

## Purpose
TBD - created by archiving change refactor-express-judge. Update Purpose after archive.
## Requirements
### Requirement: Submission Handling
The system SHALL provide an API to accept submissions from authorized participants.

#### Scenario: Successful Submission
- **WHEN** a participant submits code for a valid quest with a valid Supabase JWT.
- **THEN** the system SHALL create a submission record in the database with status `pending`.

### Requirement: Multi-Language Evaluation
The system SHALL support evaluating multiple programming languages, including but not limited to:
- Blockly (XML/JSON)
- JavaScript
- Python
- Lua
- Scratch (.sb3)

#### Scenario: Script Evaluation
- **WHEN** a submission contains text-based code (JS/Python/Lua).
- **THEN** the judge SHALL execute it against predefined test cases and return a score.

#### Scenario: Scratch Evaluation
- **WHEN** a submission contains a `.sb3` file.
- **THEN** the judge SHALL use a headless Scratch runner to verify sprites, coordinates, and block counts.

### Requirement: Asynchronous Updates
For long-running tasks like Scratch evaluation, the system SHALL support asynchronous status updates.

#### Scenario: Polling for Result
- **WHEN** a submission is in `judging` state.
- **THEN** the client SHALL pull the submission status until a final score is assigned.

### Requirement: Historical Logs
The system SHALL persist judge logs (worker logs) for each submission to aid in debugging and transparency.

#### Scenario: View Logs
- **WHEN** a participant or admin requests submission details.
- **THEN** the system SHALL return the `worker_log` containing execution details or error messages.

