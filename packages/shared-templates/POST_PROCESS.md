# Post-Processor Documentation

The `postProcess` function allows you to modify the generated map after the initial solution path has been created. This is useful for adding decorative elements, creating terrain features involving the path (like islands or mountains), or filling empty space.

## Usage

Add a `postProcess` call at the end of your template file:

```javascript
postProcess({
    type: 'extendShape', // or 'fillBoundingBox', 'addTrees'
    ...params
});
```

You can call `postProcess` multiple times for layered effects:

```javascript
// First: Create terrain
postProcess({ type: 'extendShape', shape: 'mountain', material: 'stone' });

// Second: Add trees
postProcess({ type: 'addTrees', count: [3, 5], excludePath: true });
```

---

## 1. extendShape

Extends the terrain around specific points of interest (currently "Switches") to create islands, mountains, or platforms.

### Configuration

```javascript
postProcess({
    type: 'extendShape',
    shape: 'mountain',     // Shape type
    size: 5,               // Base size
    height: [3, 8],        // Height range (for mountains)
    bias: 'right',         // Direction relative to path
    levelMode: 'same',     // Y-level relative to path
    material: 'stone',     // Block material
    connectPath: true      // Generate bridge/connector
});
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| **type** | `'extendShape'` | Required | Identifier for this processor. |
| **shape** | `'square' \| 'rectangle' \| 'circle' \| 'mountain'` | `'square'` | The geometric shape to generate. |
| **size** | `number \| [min, max]` | `3` | The diameter/width of the shape basis. If array, a random value is chosen. |
| **height** | `number \| [min, max]` | `[3, 5]` | **(Mountain only)** The height of the pyramid/spire. Random if array. |
| **bias** | `'center' \| 'left' \| 'right'` | `'center'` | Position relative to the path. `'center'` places shape ON the path. `'left'`/`'right'` places it to the side. |
| **levelMode** | `'same' \| 'stepDown'` | `'same'` | `'same'`: Shape matches path Y. `'stepDown'`: Shape is 1 block lower than path. |
| **material** | `string` | `'grass'` | Material shorthand: `'grass'`, `'stone'`, `'water'`, `'ice'`, `'sand'`, `'dirt'`. Maps to asset keys like `ground.stoneGrey1`. |
| **connectPath** | `boolean` | `false` | If true, generates a "connector" bridge from the path to the shape (useful if bias is not center). |

### Material Mapping

The `material` parameter is automatically mapped to full asset keys:

| Material | Asset Key |
|----------|-----------|
| `'grass'` | `ground.earthChecker` |
| `'stone'` | `ground.stoneGrey1` |
| `'water'` | `ground.waterFull` |
| `'ice'` | `ground.ice` |
| `'sand'` | `ground.sandBeach` |
| `'dirt'` | `ground.dirt` |

### Important Behaviors

- **Collision Detection**: The processor strictly removes any generated blocks that would overlap with the solution path's clearance volume (from `PathY - 1` up to `PathY + 20`). This ensures mountains do not block the player's path.
- **Mountain Generation**:
    - Creates a stepped pyramid.
    - If `bias` is `'left'` or `'right'`, the mountain is offset by `1 block` (adjacent) from the path.
    - Supports "Spire" generation: if the top of the pyramid narrows to 1 block but `height` is not reached, it continues extending upward as a pillar/tower.

---

## 2. fillBoundingBox

Fills the rectangular area defined by the path's extent with blocks. Useful for creating a "Ground" or "Water" layer underneath the entire level.

### Configuration

```javascript
postProcess({
    type: 'fillBoundingBox',
    offset: -1,
    material: 'water',
    walkable: false
});
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| **type** | `'fillBoundingBox'` | Required | Identifier for this processor. |
| **offset** | `number` | `0` | Y-level offset relative to the **lowest point** of the path. e.g., `-1` puts water 1 block below the lowest path block. |
| **material** | `string` | `'grass'` | Material for the filled blocks. Uses same mapping as `extendShape`. |
| **walkable** | `boolean` | `true` | Whether the player can walk on these blocks. |

---

## 3. addTrees

Adds tree decorations to non-path positions on the map. Trees are placed on top of the highest existing block at each (x, z) position.

### Configuration

```javascript
postProcess({ 
    type: 'addTrees', 
    count: [3, 5],        // Min and max tree count
    treeTypes: ['tree.tree01', 'tree.tree02', 'tree.tree03', 'tree.tree04', 'tree.tree05'],
    excludePath: true     // Don't place on path
});
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| **type** | `'addTrees'` | Required | Identifier for this processor. |
| **count** | `number \| [min, max]` | `[3, 5]` | Number of trees to place. If array, a random value in range is chosen. |
| **treeTypes** | `string[]` | `['tree.tree01', ..., 'tree.tree05']` | Array of tree asset keys to randomly choose from. Must use full key format. |
| **excludePath** | `boolean` | `true` | If true, trees will not be placed on path coordinates. |

### Important Behaviors

- Trees are placed at `Y + 1` where `Y` is the highest existing block at that `(x, z)` position.
- Trees are marked as `walkable: false`.
- If there are fewer available positions than requested `count`, only available positions will be used.

---

## Example Scenarios

### A. Switch Mountains (Side Areas)
Creates stone mountains to the right of every switch, connected by a bridge.

```javascript
postProcess({ 
    type: 'extendShape', 
    shape: 'mountain', 
    size: [2, 5], 
    height: [3, 8],
    bias: 'right',
    levelMode: 'same',
    material: 'stone',
    connectPath: true
});
```

### B. Floating Platforms (Step Down)
Creates square grass platforms slightly below the path level to the left.

```javascript
postProcess({ 
    type: 'extendShape', 
    shape: 'square', 
    size: 3, 
    bias: 'left',
    levelMode: 'stepDown',
    material: 'grass',
    connectPath: true
});
```

### C. Ocean Base
Fills the entire map area with water 1 block below the path.

```javascript
postProcess({
    type: 'fillBoundingBox',
    offset: -1,
    material: 'water',
    walkable: false
});
```

### D. Forest Decoration
Adds 3-5 random trees to non-path areas.

```javascript
postProcess({ 
    type: 'addTrees', 
    count: [3, 5],
    treeTypes: ['tree.tree01', 'tree.tree02', 'tree.tree03'],
    excludePath: true
});
```

### E. Complete Environment (Multiple PostProcessors)
Combines terrain extension with tree decoration.

```javascript
// Create stone mountains at switch positions
postProcess({ 
    type: 'extendShape', 
    shape: 'mountain', 
    size: [2, 5], 
    height: [3, 5],
    bias: 'right',
    material: 'stone',
    connectPath: true
});

// Add trees to the mountains and empty areas
postProcess({ 
    type: 'addTrees', 
    count: [3, 5],
    excludePath: true
});
```

---

## Future Processors (Planned)

| Type | Description | Status |
|------|-------------|--------|
| `sidewalk` | Creates walkable borders around areas | Not implemented |
| `columnSupport` | Adds support columns under elevated platforms | Not implemented |
| `wallExtrusion` | Creates walls along path edges | Not implemented |

