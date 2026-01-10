# Post-Processor Documentation

The `postProcess` function allows you to modify the generated map after the initial solution path has been created. This is useful for adding decorative elements, creating terrain features involving the path (like islands or mountains), or filling empty space.

## Usage

Add a `postProcess` call at the end of your template file:

```javascript
postProcess({
    type: 'extendShape', // or 'fillBoundingBox'
    ...params
});
```

You can call `postProcess` multiple times if needed (currently supports single call in template interpreter, but architecture allows multiple).

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
| **material** | `string` | `'grass'` | The material model for generated blocks (e.g., `'stone'`, `'grass'`, `'water'`). |
| **connectPath** | `boolean` | `false` | If true, generates a "connector" bridge from the path to the shape (useful if bias is not center). |

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
| **material** | `string` | `'grass'` | Material for the filled blocks. |
| **walkable** | `boolean` | `true` | Whether the player can walk on these blocks. |

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
