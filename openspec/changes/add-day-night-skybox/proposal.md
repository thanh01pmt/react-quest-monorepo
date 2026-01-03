# Change: Add Day/Night Skybox

## Why
Allows users to switch between Day and Night environments for better visual variety and aesthetics.

## What Changes
- Adds `environment` setting to `QuestPlayerSettings`.
- Updates `SettingsPanel` to include Environment toggle.
- Updates `Maze3DRenderer` to render Sky/Sun for "Day" and Starts/Fog for "Night".

## Impact
- Specs: `quest-player`
- Code: `QuestPlayerSettings`, `SettingsPanel`, `Maze3DRenderer`
