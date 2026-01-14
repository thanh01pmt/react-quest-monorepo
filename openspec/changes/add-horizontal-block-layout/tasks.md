# Tasks: Add Horizontal Block Layout

## Phase 1: Research & Preparation ✅

- [x] 1.1 Analyze Google Doodle SVG paths for block shapes (hat, stack, c-block)
- [x] 1.2 Document exact SVG path specifications for horizontal connectors
- [x] 1.3 Create block shape mockups/prototypes
- [x] 1.4 Analyze scratch-blocks source code for reusable algorithms

## Phase 2: SVG Block Shapes & Icons ✅

- [x] 2.1 Create `HorizontalConstants.ts` với SVG path definitions
  - [x] 2.1.1 Hat block (Start) - `generateHatBlockPath()`
  - [x] 2.1.2 Stack block - `generateStackBlockPath()`
  - [x] 2.1.3 C-Block (Loop) - `generateCBlockPath()`
- [x] 2.2 Create icon SVG files (`/public/assets/junior/`)
  - [x] 2.2.1 `start_rabbit.svg`
  - [x] 2.2.2 `move_forward.svg`
  - [x] 2.2.3 `turn_left.svg`
  - [x] 2.2.4 `turn_right.svg`
  - [x] 2.2.5 `loop.svg`
- [x] 2.3 Define NOTCH_PATH_DOWN/UP for 3D effect connectors

## Phase 3: Custom Blockly Renderer ✅

- [x] 3.1 Create `HorizontalRenderer` class extending Blockly's Zelos renderer
  - [x] 3.1.1 Override `makeConstants_()` for horizontal metrics
  - [x] 3.1.2 Create `HorizontalConstantsProvider` with custom notch/puzzle shapes
  - [x] 3.1.3 Override `makeNotch()` and `makePuzzleTab()` for horizontal connections
- [x] 3.2 Register renderer with `Blockly.blockRendering.register('horizontal', ...)`
- [x] 3.3 Create `HorizontalConstantsProvider` → `HorizontalConstants.ts`
- [x] 3.4 Integrate renderer into `HorizontalBlocklyRenderer` component

## Phase 4: Junior Theme ✅

- [x] 4.1 Create `juniorTheme.ts` với:
  - [x] 4.1.1 Block colors matching Google Doodle palette
  - [x] 4.1.2 Large icons (40x40px minimum)
  - [x] 4.1.3 Simplified block styling
- [x] 4.2 Pill-shaped workspace background (in CSS)
- [x] 4.3 Configure bottom flyout layout (`toolboxPosition: 'end'`)

## Phase 5: Icon-Only Block Definitions ✅

- [x] 5.1 Create `juniorBlocks.ts` với icon-only variants
  - [x] 5.1.1 `junior_start` - rabbit icon
  - [x] 5.1.2 `junior_moveForward` - arrow icon
  - [x] 5.1.3 `junior_turnLeft` - left curve arrow
  - [x] 5.1.4 `junior_turnRight` - right curve arrow
  - [x] 5.1.5 `junior_repeat` - loop icon với number input
- [x] 5.2 Create code generators for junior blocks
- [x] 5.3 Create `getJuniorToolbox()` configuration

## Phase 6: HorizontalBlocklyRenderer Component ✅

- [x] 6.1 Create `HorizontalBlocklyRenderer.tsx` component
  - [x] 6.1.1 Integrate junior theme
  - [x] 6.1.2 Handle workspace layout with custom 'horizontal' renderer
  - [x] 6.1.3 Add undo/reset controls
- [x] 6.2 Create `HorizontalBlocklyRenderer.css` styles
- [x] 6.3 Add resize handling with pill-shaped container
- [x] 6.4 Enable `useHorizontalRenderer` prop for renderer selection

## Phase 7: Integration & Mode Switching ✅

- [x] 7.1 Add `blockMode: 'vertical' | 'horizontal'` to `QuestPlayerSettings`
- [x] 7.2 Add Block Layout dropdown to `SettingsPanel`
- [x] 7.3 Wire `blockMode` props in `QuestPlayer`
- [x] 7.4 Conditional render `HorizontalBlocklyRenderer` when `blockMode === 'horizontal'`

## Phase 8: Testing & Verification

- [ ] 8.1 Unit tests for horizontal renderer
- [ ] 8.2 Visual regression tests for block shapes
- [ ] 8.3 Integration test: drag-drop horizontal blocks
- [ ] 8.4 Cross-browser testing (Chrome, Safari, Firefox)
- [ ] 8.5 Mobile/tablet touch interaction testing
- [ ] 8.6 Accessibility testing (keyboard navigation)

## Phase 9: Documentation

- [ ] 9.1 Update README với Junior Mode usage
- [ ] 9.2 Create developer guide for custom renderers
- [x] 9.3 Document block shape specifications (in `HorizontalConstants.ts`)
- [ ] 9.4 Add Storybook stories for horizontal components

## Phase 10: Connection Positioning Patches (CRITICAL) 🆕

> **Root cause identified:** Blocks display vertically because connection positioning still uses vertical logic.

- [x] 10.1 Implement horizontal connection positioning in `HorizontalRenderInfo.ts`
  - [x] 10.1.1 Override `finalize_()` to set `previousConnection` at LEFT side `(x, y + height - 8)`
  - [x] 10.1.2 Override to set `nextConnection` at RIGHT side `(x + width, y + height - 8)`
- [x] 10.2 Create `HorizontalFlyout.ts` class (port from `rr` class in logo17.2.js)
  - [x] 10.2.1 Override `layout_()` to position blocks horizontally with X gaps
  - [x] 10.2.2 Override `getMetrics_()` to return contentWidth-based metrics
  - [x] 10.2.3 Override scrolling to use horizontal axis
- [x] 10.3 Patch `getHeightWidth()` for horizontal block stacking
  - [x] 10.3.1 Connected blocks add WIDTH instead of HEIGHT
  - [x] 10.3.2 Block height becomes `Math.max()` of stack instead of sum

## Phase 11: Optimization & Visual Polish (Completed) ✅

- [x] 11.1 Fix C-Block (Loop) Shape & Layout
  - [x] 11.1.1 Redesign SVG path for Horizontal U-Shape (Right-opening bay)
  - [x] 11.1.2 Fix Bay positioning (Bottom) vs Main Body (Top)
  - [x] 11.1.3 Implement Fixed Height scaling strategy (Only width expands)
- [x] 11.2 Field Positioning & Visibility
  - [x] 11.2.1 Implement Split Layout: Icon in Header (Left), Number in Tail (Right)
  - [x] 11.2.2 Increase Tail Width to accommodate number field
- [x] 11.3 Execution Logic
  - [x] 11.3.1 Verify Generator traversing horizontal structure
  - [x] 11.3.2 Confirm integration with Game Engine interpreter
- [ ] 10.4 Register `HorizontalFlyout` when `horizontalLayout: true`
- [x] 10.5 Test drag-drop connection between horizontal blocks
- [x] 10.6 Fix C-Block (Loop) shape to match Scratch Jr (U-shape container)

---

**Progress: 38/57 tasks completed (67%)**

**Build Status:** ✓ quest-player built successfully

**BLOCKING:** Phase 10 is required for horizontal blocks to connect properly.
