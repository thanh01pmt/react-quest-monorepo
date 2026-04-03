## RENAMED Requirements
- FROM: `### Requirement: Scratch Player Render Condition`
- TO: `### Requirement: Scratch Quest Panel Render Condition`

## MODIFIED Requirements
### Requirement: Scratch Quest Panel Render Condition
The system SHALL render the `ScratchQuestPanel` component instead of `QuestPlayer` whenever the current quest is identified as a Scratch assignment.

#### Scenario: Identifying a Scratch Quest
- **WHEN** `(currentQuest as any).gameType === 'scratch'` OR `(currentQuest as any).gameConfig?.type === 'scratch'`
- **THEN** it branches into the Scratch room view containing the `ScratchQuestPanel`, preventing the `QuestPlayer` error.

## ADDED Requirements
### Requirement: Multi-Tab Scratch Interface
The `ScratchQuestPanel` SHALL provide a 3-tab interface for better user experience.

#### Scenario: Switching to History
- **WHEN** the student clicks on the "Lịch sử" tab.
- **THEN** the system SHALL fetch and display their past submission attempts for the current quest.

#### Scenario: Switching to Instructions
- **WHEN** the student clicks on the "Cách nộp" tab.
- **THEN** the system SHALL display guidelines for saving and uploading `.sb3` files.
