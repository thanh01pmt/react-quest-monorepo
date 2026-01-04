# Builder-Player Sync Capability

## ADDED Requirements

### Requirement: Builder Send to Player
The Builder app SHALL provide a "Send to Player" button that sends the current quest to the Player app for immediate testing via the `/sync` route.

#### Scenario: Local sync via localStorage
- **WHEN** the user clicks "Send to Player" in Builder
- **AND** the Player URL is set to localhost
- **THEN** the quest JSON SHALL be saved to `localStorage.setItem('builderQuest', ...)`
- **AND** a new browser tab SHALL open at `{playerUrl}/sync`
- **AND** a success toast SHALL be displayed

#### Scenario: Production sync via URL
- **WHEN** the user clicks "Send to Player" in Builder
- **AND** the Player URL is set to a non-localhost URL
- **THEN** the quest JSON SHALL be compressed and base64-encoded
- **AND** a new browser tab SHALL open at `{playerUrl}/sync?quest=<encoded>`

---

### Requirement: Player Sync Route
The Player app SHALL provide a dedicated `/sync` route to handle quests sent from Builder.

#### Scenario: Load from URL parameter
- **WHEN** the user navigates to `/sync?quest=<encoded>`
- **THEN** the Player SHALL decode and decompress the quest data
- **AND** display the SyncPage with quest info (ID, level, title)
- **AND** show a "Play" button to start the quest
- **AND** show a "Back to Home" button to exit sync mode

#### Scenario: Load from localStorage
- **WHEN** the user navigates to `/sync` without query parameters
- **AND** `localStorage.getItem('builderQuest')` contains valid quest JSON
- **THEN** the Player SHALL parse and display the quest
- **AND** show the SyncPage with quest controls

#### Scenario: No quest available
- **WHEN** the user navigates to `/sync`
- **AND** no URL parameter is present
- **AND** no localStorage data is available
- **THEN** the Player SHALL display an error message "No quest available"
- **AND** show a "Back to Home" button

#### Scenario: Return to sync after playing
- **WHEN** the user completes or exits a quest loaded via `/sync`
- **THEN** the Player SHALL navigate back to `/sync` (not home)
- **AND** the quest SHALL remain available for replay

#### Scenario: Clear builder quest
- **WHEN** the user clicks "Back to Home" on the SyncPage
- **THEN** the localStorage item SHALL be cleared
- **AND** the Player SHALL navigate to the home route

---

### Requirement: Configurable Player URL
The Builder app SHALL allow users to configure the target Player URL.

#### Scenario: Default URL for local development
- **WHEN** no Player URL has been configured
- **THEN** the default URL SHALL be `http://localhost:5173`

#### Scenario: Custom URL for production
- **WHEN** the user enters a custom Player URL in Settings
- **THEN** the URL SHALL be saved to `localStorage.setItem('playerUrl', ...)`
- **AND** subsequent "Send to Player" actions SHALL use this URL
- **AND** the URL path SHALL always include `/sync`
