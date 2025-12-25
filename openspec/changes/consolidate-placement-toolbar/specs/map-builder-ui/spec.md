# Map Builder UI Specification

## ADDED Requirements

### Requirement: Viewport Toolbar

The Map Builder SHALL display a floating `ViewportToolbar` component positioned on the left edge of the 3D viewport.

The toolbar SHALL contain two sections:
1. **Mode Section**: Navigate, Build, Select mode buttons
2. **Tools Section**: Transform tools (Move, Rotate) visible when objects are selected

#### Scenario: Mode Switching via Toolbar

- **GIVEN** the user is viewing the 3D viewport
- **WHEN** the user clicks the "Build" button on the ViewportToolbar
- **THEN** the application mode changes to "build-single"
- **AND** the Build button displays an active state

#### Scenario: Selection Sub-mode Toggle

- **GIVEN** the user has activated Select mode
- **WHEN** the user clicks "Smart" in the selection mode toggle
- **THEN** the selection mode changes to "smart"
- **AND** clicking on an object selects connected objects

### Requirement: Toolbar Keyboard Shortcuts

The toolbar SHALL support keyboard shortcuts for mode switching:
- `N` or `V` for Navigate mode
- `B` for Build mode
- `S` for Select mode (toggles between box and smart)

#### Scenario: Keyboard Mode Switch

- **GIVEN** the user is in Navigate mode
- **WHEN** the user presses the `B` key
- **THEN** the application switches to Build mode
- **AND** the ViewportToolbar visually indicates Build is active

### Requirement: Glassmorphism Styling

The ViewportToolbar SHALL apply glassmorphism styling with:
- Semi-transparent dark background (rgba with ~0.85 opacity)
- Backdrop blur effect (8-16px blur radius)
- Subtle border with low opacity white
- Soft shadow for depth

#### Scenario: Visual Appearance

- **GIVEN** the user views the 3D viewport
- **WHEN** the ViewportToolbar is rendered
- **THEN** the toolbar has a semi-transparent glassmorphism appearance
- **AND** the 3D scene is partially visible behind the toolbar

## MODIFIED Requirements

### Requirement: Left Panel Asset Palette

The AssetPalette component SHALL NOT contain Placement Mode controls. It SHALL display:
- Selection Type toggle (when in Select mode - optional, can be in toolbar)
- Build Area dimensions
- Asset categories (expandable groups)
- Quick Actions (Manual, Import)

#### Scenario: Simplified Asset Palette

- **GIVEN** the user opens the Map Builder
- **WHEN** the Left Panel is displayed with Manual tab active
- **THEN** the panel shows Selection Type, Build Area, Manual assets, and Quick Actions
- **AND** there is no "Placement Mode" section with Navigate/Build/Select buttons
