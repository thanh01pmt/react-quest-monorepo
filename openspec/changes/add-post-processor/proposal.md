# Change: Add Post-Processor System for Map Generation

## Why

The current Template Generator creates paths with items placed along a single trajectory. To enable more complex educational scenarios (open-world exploration, optimization challenges, 3D spatial reasoning), we need a **Post-Processor** system that can modify the generated map after the initial path is created.

This enables:
- **Grid/Garden gameplay**: Fill areas to allow multiple valid paths
- **Extended exploration zones**: Create plazas, islands, rooms at specific points
- **3D terrain features**: Stairs, platforms, walls, columns
- **Strategic gameplay**: Learners must optimize path through open areas

## What Changes

### Priority Implementation (Phase 1)

1. **Fill Bounding Box** - Fill all empty cells within a rectangular region enclosing the path
2. **Extend Shape** - Create square/rectangle/circle extensions at switch positions

### Future Phases (Documented but not implemented yet)

3. Sidewalk (path edge expansion)
4. Stair Fill (automatic stairs for Y changes)
5. Platform Extension (horizontal expansion at same Y)
6. Column Support (pillars under elevated blocks)
7. Underworld/Basement (blocks below path)
8. Roof/Canopy (blocks above path)
9. Wall Extrusion (vertical walls along path edges)
10. Terrain Sculpting (gradient Y changes around path)
11. Bridge Fill (connect gaps in path)
12. Item Scatter (random items on filled areas)

## Impact

- **New Package**: `@repo/academic-map-generator` - new PostProcessor module
- **Template DSL**: New functions `fillBoundingBox()`, `extendShape()`
- **Specs**: New capability `post-processor`

---

## Detailed Design: Phase 1 Features

### 1. Fill Bounding Box

**Purpose**: Fill all empty cells within the axis-aligned bounding box of the path, with configurable offset.

**Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `offset` | number | 0 | Expand bounding box by N blocks in all directions |
| `material` | string | 'grass' | Block material for filled cells |
| `walkable` | boolean | true | Whether filled blocks are traversable |

**Template API**:
```js
postProcess({
  type: 'fillBoundingBox',
  offset: 2,
  material: 'stone',
  walkable: true
});
```

**Behavior**:
1. Calculate `boundingBox(pathCoords)` → `{minX, maxX, minZ, maxZ, minY, maxY}`
2. Expand by offset: `minX -= offset`, `maxX += offset`, etc.
3. For each `(x, z)` in range, at `y = minY`:
   - If cell is empty → add block with specified material
   - If cell already has block → skip (preserve path)
4. Set `walkable` property on new blocks

---

### 2. Extend Shape

**Purpose**: At each switch position, extend a shape (square, rectangle, circle) to create exploration zones.

**Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `shape` | 'square' \| 'rectangle' \| 'circle' | 'square' | Shape to extend |
| `size` | number \| {width, height} | 3 | Size of shape (radius for circle) |
| `bias` | 'center' \| 'left' \| 'right' | 'center' | Direction relative to movement at switch |
| `levelMode` | 'same' \| 'stepDown' | 'same' | Y-level handling for 3D maps |
| `material` | string | 'grass' | Block material |
| `connectPath` | boolean | false | Create bridge/connector from main path to island |

**Template API**:
```js
postProcess({
  type: 'extendShape',
  shape: 'square',
  size: 4,
  bias: 'left',
  levelMode: 'stepDown',
  material: 'stone',
  connectPath: true
});
```

**Behavior**:
1. Find all switch positions in the generated map
2. For each switch at `(x, y, z)` with movement direction `dir`:
   - Calculate offset direction based on `bias`:
     - `center`: shape centered on switch
     - `left`: shape offset perpendicular-left to `dir`
     - `right`: shape offset perpendicular-right to `dir`
   - Determine Y level:
     - `same`: use switch Y
     - `stepDown`: use switch Y - 1
   - Generate shape coordinates
   - If `connectPath` and Y differs or bias != center:
     - Add connector blocks from switch to shape edge
   - Fill shape with blocks (skip existing)

**Shape Coordinate Generation**:
- **Square**: `(cx ± size/2, cz ± size/2)`
- **Rectangle**: `(cx ± width/2, cz ± height/2)`
- **Circle**: All `(x, z)` where `√((x-cx)² + (z-cz)²) ≤ radius`

**3D Traversability Rules**:
- Extended area must be adjacent to path OR have connector
- If `levelMode: 'stepDown'`, character can `moveForward` off edge
- If `levelMode: 'same'`, character can `moveForward` directly
- Connector placed perpendicular to path to avoid blocking main route

---

## Verification Plan

### Automated Tests
- Unit tests for `fillBoundingBox` coordinate calculation
- Unit tests for `extendShape` shape generation
- Integration test: template with `fillBoundingBox` generates expected blocks
- Integration test: template with `extendShape` at switch creates accessible zones

### Manual Verification
- Visual inspection in Map Builder 3D view
- Verify character can traverse filled areas
- Verify extended shapes at switches are reachable
- Test with both flat and 3D (Y-changing) maps
