# Change: Add Horizontal Block Layout for Junior Mode

## Why

Trẻ em từ 5-7 tuổi học lập trình hiệu quả hơn với **horizontal block layout** (như Google Doodle "Celebrating 50 years of Kids Coding" và ScratchJr). Giao diện này:
- Trực quan hơn cho người mới bắt đầu
- Phù hợp với thiết bị màn hình nhỏ (tablets, phones)
- Đã được chứng minh hiệu quả qua hàng triệu trẻ em trên Scratch

Quest Player hiện tại chỉ hỗ trợ vertical block layout (Scratch-style), cần thêm **Junior Mode** với horizontal blocks.

## What Changes

### Core Features
- **Custom Horizontal Renderer**: Tạo renderer mới với block connectors trái/phải thay vì top/bottom
- **Icon-Only Blocks**: Phiên bản simplified của các blocks hiện có, chỉ dùng icons (không text)
- **Horizontal Workspace Container**: Pill-shaped container với blocks flow từ trái→phải
- **Bottom Flyout**: Toolbox nằm ở phía dưới workspace

### Block Types
| Block | Color | Shape |
|-------|-------|-------|
| Start (Rabbit) | Teal `#14A795` | Hat (pill-left) |
| Move Forward | Green `#A4DD4A` | Stack (horizontal) |
| Turn Left/Right | Blue `#26A2F6` | Stack (horizontal) |
| Loop | Orange `#F7941D` | C-Block (horizontal) |

### **BREAKING**: None - Additive feature, existing vertical layout unchanged

## Impact

- **Specs**: New spec for `blockly-renderer` capability
- **Code**:
  - `packages/quest-player/src/components/BlocklyRenderer/` - New `HorizontalRenderer.tsx`
  - `packages/quest-player/src/games/maze/blocks.ts` - Add icon-only block variants
  - `packages/quest-player/theme.ts` - Add `juniorTheme`
  - `packages/quest-player/src/renderers/` - New custom renderer
  - New SVG block shape definitions

## scratch-blocks Package Analysis

> **Note:** User added `packages/scratch-blocks` for evaluation.

### Package Structure
```
packages/scratch-blocks/
├── core/
│   ├── block_render_svg_horizontal.js  # 892 lines - HORIZONTAL RENDERER
│   ├── block_render_svg_vertical.js    # 63KB - Vertical renderer
│   ├── flyout_horizontal.js            # 16KB - Horizontal flyout
│   └── ... (95 core files)
├── blocks_horizontal/
│   ├── control.js    # repeat, forever, stop, wait
│   ├── event.js      # start blocks (hat)
│   └── ...
└── media/icons/      # 71 SVG icons
```

### Key Discoveries

| Feature | Location | Reusable? |
|---------|----------|:---------:|
| SVG Notch Paths | `block_render_svg_horizontal.js:165-186` | ✅ |
| Hat Block Rendering | `block_render_svg_horizontal.js:654-690` | ✅ |
| C-Block (Statement) | `block_render_svg_horizontal.js:721-765` | ✅ |
| Icon-only Block Defs | `blocks_horizontal/control.js` | ✅ |
| Horizontal Flyout | `flyout_horizontal.js` | ⚠️ |

### **CRITICAL: Build System Incompatibility**

```javascript
// scratch-blocks uses Google Closure Library
goog.provide('Blockly.BlockSvg.render');
goog.require('Blockly.BlockSvg');
goog.require('Blockly.constants');
```

- Requires `google-closure-library` and `google-closure-compiler`
- Python build script (`build.py`)
- Not compatible with modern ES modules / Vite / TypeScript

### Recommendation: **Hybrid Approach (Updated after logo17.2.js analysis)**

| Option | Effort | Recommendation |
|--------|--------|:--------------:|
| **A) Use scratch-blocks directly** | 🔴 High - need Closure compiler, separate bundle | ❌ |
| **B) Port key algorithms from logo17.2.js** | 🟡 Medium - patch Blockly npm with horizontal logic | ✅ |
| **C) Full custom renderer from scratch** | 🔴 High - reinvent the wheel | ❌ |

**Chosen: Option B** - Port these critical functions from `logo17.2.js` / `scratch-blocks`:

> [!IMPORTANT]
> **Root cause identified:** Current implementation only changes SVG paths but doesn't modify **connection positioning**. Blocks still connect vertically because:
> - `previousConnection.moveTo(x, y + height)` → should be `moveTo(x, y + height - 8)` (LEFT side)
> - `nextConnection.moveTo(x + width, y + height)` → not `(x, y + totalHeight)` (RIGHT side)

**Critical components to port:**
1. **Connection positioning** (lines 1046-1049 in logo17.2.js)
   - `previousConnection` at LEFT: `(x, y + height - 8)`
   - `nextConnection` at RIGHT: `(x + width, y + height - 8)`
2. **HorizontalFlyout class** (class `rr` in logo17.2.js)
   - `layout_()` - position blocks horizontally with X gaps
   - `getMetrics_()` - return contentWidth instead of contentHeight
3. **SVG notch paths** (already ported to `HorizontalConstants.ts`)
4. **Width-based stacking** in `getHeightWidth()`: `width += nextBlockWidth` instead of height

**Reference files:**
- `packages/refs/logo17.2.js` - Google Doodle bundled JS (710KB)
- `packages/scratch-blocks/core/block_render_svg_horizontal.js`
- `packages/scratch-blocks/core/flyout_horizontal.js`

## References

- [Google Doodle "Celebrating 50 years of Kids Coding"](https://www.google.com/logos/2017/logo17/logo17.html)
- [ScratchJr](https://scratchjr.org)
- [Scratch Blocks Repository](https://github.com/scratchfoundation/scratch-blocks)
- Local reference: `packages/refs/specifications/coding.html` (Google Doodle source)
- Local reference: `packages/scratch-blocks/` (Source code for extraction)
