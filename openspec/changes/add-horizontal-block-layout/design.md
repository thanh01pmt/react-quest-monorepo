# Design: Horizontal Block Layout for Junior Mode

## Context

Google Doodle "Celebrating 50 years of Kids Coding" (2017) implemented a successful horizontal block programming interface. After reverse engineering the source (`packages/refs/specifications/coding.html`), we've identified the key techniques:

1. **Custom SVG block paths** với connectors rotated 90° (left/right thay vì top/bottom)
2. **Icon-only blocks** (không text labels)
3. **Pill-shaped workspace container**
4. **Bottom flyout** cho available blocks

## Goals

- ✅ Tạo "Junior Mode" với horizontal block layout
- ✅ Giữ backward compatibility với vertical layout hiện tại
- ✅ Support cả mouse và touch interactions
- ✅ Optimize cho thiết bị màn hình nhỏ

## Non-Goals

- ❌ Thay thế hoàn toàn vertical layout
- ❌ Support cho tất cả block types (chỉ basic movement + loop)
- ❌ Tích hợp scratch-blocks library (dùng Blockly native)

## Critical Finding: Connection Positioning (from logo17.2.js analysis)

> [!IMPORTANT]
> **The core difference between vertical and horizontal blocks is NOT just SVG paths - it's CONNECTION POSITIONING.**

### Vertical Layout (Standard Blockly)
```
previousConnection at TOP:    (x + offsetX, y)
nextConnection at BOTTOM:     (x + offsetX, y + height)
→ Blocks stack VERTICALLY
```

### Horizontal Layout (Google Doodle / Scratch-Blocks)
```javascript
// From logo17.2.js lines 1046-1049:
previousConnection at LEFT:   (x, y + height - 8)
nextConnection at RIGHT:      (x + width, y + height - 8)
→ Blocks stack HORIZONTALLY
```

Both connections have the **same Y coordinate** but different X. This is what makes connected blocks appear side-by-side.

---

## Architecture Decisions

### Decision 1: Custom Blockly Renderer vs. scratch-blocks

**Chosen: Custom Blockly Renderer with Connection Patches**

| Option | Pros | Cons |
|--------|------|------|
| A) Custom Renderer | Full control, same ecosystem, code generators work | Need to patch connection logic |
| B) scratch-blocks | Native horizontal support | Stale library, no TypeScript, Closure compiler |

**Rationale:** Patch Blockly npm's connection positioning while keeping the core updatable.

### Decision 2: Block Definition Strategy

**Chosen: Separate Junior Blocks**

```typescript
// Option A: Mode toggle on existing blocks (rejected)
Blockly.Blocks['maze_moveForward'] = {
  init: function() {
    if (this.workspace.options.horizontalLayout) { ... }
  }
}

// Option B: Separate block types (chosen)
Blockly.Blocks['junior_moveForward'] = { ... }
```

**Rationale:** Separation of concerns, dễ maintain, không ảnh hưởng existing blocks.

### Decision 3: SVG Path Generation

**Chosen: Hardcoded optimized paths**

Dựa trên Google Doodle analysis:

```typescript
// Hat block (Start) - 64x64 with pill-left
const HAT_PATH = `
  m 32,0 
  A 32,32 0 0,0 0,32 
  a 32,32 0 0,0 32,32 
  H 64 
  a 4,4 0 0,0 4,-4 
  v -10 c 0,-2 1,-3 2,-4 l 4,-4 c 1,-1 2,-2 2,-4 
  v -12 c 0,-2 -1,-3 -2,-4 l -4,-4 c -1,-1 -2,-2 -2,-4 
  V 4 a 4,4 0 0,0 -4,-4 z
`;

// Stack block - 64x64 with left/right connectors
const STACK_PATH = `
  m 4,0 
  A 4,4 0 0,0 0,4 
  V 14 c 0,2 1,3 2,4 l 4,4 c 1,1 2,2 2,4 v 12 c 0,2 -1,3 -2,4 l -4,4 c -1,1 -2,2 -2,4 
  V 60 a 4,4 0 0,0 4,4 
  H 60 a 4,4 0 0,0 4,-4 
  v -10 c 0,-2 1,-3 2,-4 l 4,-4 c 1,-1 2,-2 2,-4 v -12 c 0,-2 -1,-3 -2,-4 l -4,-4 c -1,-1 -2,-2 -2,-4 
  V 4 a 4,4 0 0,0 -4,-4 z
`;
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     QuestPlayer                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  mode: 'standard' | 'junior'                            ││
│  │  ┌─────────────────────────────────────────────────────┐││
│  │  │ mode === 'junior' ?                                 │││
│  │  │   <HorizontalBlocklyRenderer />                     │││
│  │  │ : <BlocklyRenderer />                               │││
│  │  └─────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
packages/quest-player/
├── src/
│   ├── components/
│   │   ├── BlocklyRenderer/           # Existing vertical
│   │   │   ├── BlocklyRenderer.tsx
│   │   │   └── BlocklyRenderer.css
│   │   └── HorizontalBlocklyRenderer/ # NEW
│   │       ├── HorizontalBlocklyRenderer.tsx
│   │       ├── HorizontalBlocklyRenderer.css
│   │       └── index.ts
│   ├── renderers/                      # NEW
│   │   ├── HorizontalRenderer.ts       # Custom Blockly renderer
│   │   ├── HorizontalConstantsProvider.ts
│   │   └── HorizontalPathObject.ts
│   ├── games/
│   │   └── maze/
│   │       ├── blocks.ts               # Existing
│   │       └── juniorBlocks.ts         # NEW
│   └── themes/
│       ├── mazeTheme.ts                # Existing (move from theme.ts)
│       └── juniorTheme.ts              # NEW
├── public/
│   └── assets/
│       └── junior/                     # NEW
│           ├── start_rabbit.svg
│           ├── move_forward.svg
│           ├── turn_left.svg
│           ├── turn_right.svg
│           └── loop.svg
└── theme.ts                            # Re-export themes
```

## Color Palette (Google Doodle-inspired)

| Role | Color | Usage |
|------|-------|-------|
| Start Block | `#14A795` | Hat block background |
| Start Shadow | `#338c7b` | Hat block shadow |
| Move Block | `#A4DD4A` | Movement blocks |
| Move Shadow | `#009444` | Movement shadow |
| Turn Block | `#26A2F6` | Turn blocks |
| Turn Shadow | `#007ec4` | Turn shadow |
| Loop Block | `#F7941D` | Loop/repeat blocks |
| Loop Shadow | `#c16500` | Loop shadow |
| Workspace BG | `#72D4C8` | Pill container |

## Block Dimensions

| Property | Value | Notes |
|----------|-------|-------|
| Block Size | 64x64 px | Standard size (scalable) |
| Icon Size | 40x40 px | Centered in block |
| Connector Width | 8 px | Puzzle notch width |
| Connector Height | 32 px | Puzzle notch height |
| Border Radius | 4 px | Block corners |
| Pill Radius | 32 px | Hat block semicircle |
| Shadow Offset | 3 px | 3D effect |

## API Design

```typescript
// HorizontalBlocklyRenderer props
interface HorizontalBlocklyRendererProps {
  xml: string;
  width?: string;
  height?: string;
  showControls?: boolean;
  onCodeChange?: (code: string) => void;
  onBlocksChange?: (xml: string) => void;
  readOnly?: boolean;
  maxBlocks?: number;
  availableBlocks?: ('start' | 'forward' | 'turnLeft' | 'turnRight' | 'loop')[];
}

// QuestPlayer Junior Mode
interface QuestPlayerProps {
  // ... existing props
  mode?: 'standard' | 'junior';
  juniorOptions?: {
    maxLoopDepth?: number;      // Default: 1
    maxBlocks?: number;         // Default: 10
    showNumbers?: boolean;      // Show loop count, default: true
  };
}
```

## Risks & Trade-offs

| Risk | Mitigation |
|------|------------|
| Blockly API changes | Pin Blockly version, comprehensive tests |
| Performance with many blocks | Limit maxBlocks in junior mode |
| Touch accuracy on small screens | Larger blocks (64px), snap assistance |
| Maintenance of custom renderer | Extensive documentation, unit tests |

## Migration Plan

**Phase 1 (MVP):** Standalone HorizontalBlocklyRenderer component
**Phase 2:** Integration với QuestPlayer mode toggle
**Phase 3:** Tutorial/onboarding cho Junior Mode
**Phase 4:** Analytics to compare learning outcomes

## Open Questions

1. ~~Số lượng blocks cho Junior Mode?~~ → **Resolved:** 5 blocks (start, forward, turnL, turnR, loop)
2. ~~Loop có input số hay preset?~~ → **Resolved:** Number input (1-9)
3. **Có cần hiệu ứng âm thanh?** → Defer to future enhancement
4. ~~Localization cho icon tooltips?~~ → **Resolved:** Yes, reuse existing i18n system
5. **HorizontalFlyout:** Do we port the full `rr` class or use simpler CSS-based approach? → **Investigating**

---

## Technical Implementation Notes (from logo17.2.js)

### Connection Positioning Code (to port)
```typescript
// HorizontalRenderInfo.ts - finalize_() override
if (this.block_.previousConnection) {
  const x = blockXY.x;
  const y = blockXY.y + this.height_ - 8; // 8 = notch center offset
  this.block_.previousConnection.moveTo(x, y);
}

if (this.block_.nextConnection) {
  const x = blockXY.x + this.width_;
  const y = blockXY.y + this.height_ - 8;
  this.block_.nextConnection.moveTo(x, y);
}
```

### getHeightWidth() Override
```typescript
// For horizontal layout, connected blocks add to WIDTH not HEIGHT
getHeightWidth() {
  let { height, width } = super.getHeightWidth();
  const nextBlock = this.getNextBlock();
  if (nextBlock) {
    const nextHW = nextBlock.getHeightWidth();
    width += nextHW.width - NOTCH_WIDTH; // Stack horizontally
    height = Math.max(height, nextHW.height); // Height is max, not sum
  }
  return { height, width };
}
```
