## ADDED Requirements

### Requirement: Scratch Starter Project Visibility

The system SHALL explicitly display a "Dự án mẫu" (Starter Project) section in the ScratchRoom whenever a starter project URL or Scratch Project ID is provided in the `gameConfig`.

#### Scenario: Displaying starter link in ScratchQuestPanel
- **WHEN** the `currentQuest.gameConfig` contains `starterSb3Url` or `scratchProjectId`
- **THEN** it displays a dedicated card with buttons to download the `.sb3` or open in TurboWarp.

### Requirement: Responsive Scratch Sidebar

In TurboWarp mode, the system SHALL provide a collapsible sidebar to allow students to maximize the size of the editor while maintaining access to problem instructions and submission results.

#### Scenario: Collapsing the sidebar
- **WHEN** the user clicks the collapse button (◀/▶)
- **THEN** the sidebar width shrinks to a minimal state, and the main editor area expands to fill the screen.

## MODIFIED Requirements

### Requirement: Scratch Player Render Condition

The system SHALL pass the entire `Quest` object to the Scratch player components instead of just `questId`.

#### Scenario: Identifying a Scratch Quest
- **WHEN** `(currentQuest as any).gameType === 'scratch'` OR `(currentQuest as any).gameConfig?.type === 'scratch'`
- **THEN** it branches into the Scratch room view containing the modernized panels, using the `currentQuest` object to populate metadata.
