## ADDED Requirements

### Requirement: Track Run and Debug Actions
The system SHALL track the number of times the user initiates "Run" or "Debug" modes and record the time intervals between these actions.

#### Scenario: User attempts multiple runs
- **WHEN** the user clicks "Run" or "Debug" buttons multiple times.
- **THEN** the `runCount` or `debugCount` SHALL increment.
- **AND** the time elapsed since the last run/debug SHALL be recorded in `intervals`.

### Requirement: Measure Time to Achievement
The system SHALL record the exact time duration from the start of the quest until the user achieves specific star ratings (1, 2, or 3 stars).

#### Scenario: Achieving 3 Stars
- **WHEN** the user completes the level with a 3-star rating.
- **THEN** the `starTime.3` metric SHALL record the timestamp or duration relative to start.
