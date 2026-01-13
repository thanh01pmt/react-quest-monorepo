# Template Structure Guide

This document defines the standard structure for Quest Map Templates. All new templates MUST follow this format strictly to ensure compatibility with the Quest Builder logic.

## 1. File Format
- **Extension**: `.md` (Markdown)
- **Location**: `packages/shared-templates/templates/<category>/<filename>.md`

## 2. Frontmatter (Metadata)
Every template must start with a YAML frontmatter block:

```yaml
---
id: unique-kebab-case-id
name: "Human Readable Name"
category: sequential | loop | conditional | function
concepts: ["concept1", "concept2"]
difficulty: 1-5
tags: ["tag1", "tag2"]
author: system
version: 1
description: "Brief description of what the template teaches"
---
```

## 3. Description Section
A specific H1 header followed by a brief description.

```markdown
# Human Readable Name

Detailed description of the template's educational goal and mechanics.
```

## 4. Features Section (REQUIRED)
Explains the logical constraints and design decisions of the template.

```markdown
## Features

- **Feature 1**: Explain why a parameter is fixed (e.g., "Straight Path: `_TURN_STYLE_ = 'straight'`")
- **Feature 2**: Explain random elements (e.g., "Dynamic Length: `LEN` is random(3, 8)")
- **Feature 3**: Explain safety constraints (e.g., "No Start Item: `_NO_ITEM_AT_ = 'noItemStart'`")
```

## 5. Solution & Parameters (REQUIRED)
This section contains the executable JavaScript code for generating the map.

### Rules:
1. **FULL Parameter Set**: You MUST define all 8 standard parameters, even if they are fixed values.
2. **Random Seed**: You MUST include `_SEED_ = random(1, 99999)` for reproducibility options.
3. **randomPattern()**: The core logic MUST rely on `randomPattern()` (not manual loops/moves unless composing patterns).

### Standard Code Block:

```js
// Parameters
var _MIN_STEPS_ = 6;
var _MAX_STEPS_ = 8;
var _INTERACTION_ = 'crystal';       // OPTIONS: crystal, switch, key, mixed, null
var _TURN_STYLE_ = 'straight';       // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null
var _TURN_POINT_ = 'null';           // OPTIONS: null, start, end, mid, random
var _HAS_JUMP_ = 'noJump';           // OPTIONS: random, withJump, noJump, null
var _NO_ITEM_AT_ = 'noItemBoth';     // OPTIONS: null, noItemStart, noItemEnd, noItemBoth
var LEN = random(_MIN_STEPS_, _MAX_STEPS_);
var _SEED_ = random(1, 99999);       // REQUIRED: Random seed for pattern generation

// Solution
// Use randomPattern with ALL parameters
randomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);

// Optional: Add connecting moves if composing multiple patterns
// moveForward();
// turnRight();
// randomPattern(...);

// Optional: Add post-processing for terrain/decoration
// postProcess({ type: 'extendShape', shape: 'mountain', material: 'stone' });
// postProcess({ type: 'addTrees', count: [3, 5] });
```

## 6. Parameter Reference

| Parameter | Type | Options | Description |
|-----------|------|---------|-------------|
| `_MIN/MAX_STEPS_` | number | Integer | Length range of the pattern |
| `_INTERACTION_` | string | `'crystal'`, `'switch'`, `'key'`, `'mixed'`, `'null'` | Type ('mixed'=both types, 'null'=none) |
| `_TURN_STYLE_` | string | `'straight'`, `'turnLeft'`, `'turnRight'`, `'uTurn'`, `'zTurn'`, `'randomLeftRight'`, `'random'`, `'null'` | Shape ('uTurn'=LL/RR, 'zTurn'=LR/RL) |
| `_TURN_POINT_` | string | `'null'`, `'start'`, `'mid'`, `'end'`, `'random'` | Turn position |
| `_HAS_JUMP_` | string | `'random'`, `'withJump'`, `'noJump'`, `'null'` | Include jumps |
| `_NO_ITEM_AT_` | string | `'null'`, `'noItemStart'`, `'noItemEnd'`, `'noItemBoth'` | Boundary constraints |
| `_SEED_` | number | `random(1, 99999)` | Seed for reproducible random generation |

## 7. Supported Basic Actions

While `randomPattern()` is the primary tool, you can use these low-level actions to connect patterns or add specific ending moves.

| Action | Description | Notes |
|--------|-------------|-------|
| `moveForward()` | Moves player forward 1 block | Creates a block if none exists |
| `turnLeft()` | Turns player 90 degrees left | Changes direction |
| `turnRight()` | Turns player 90 degrees right | Changes direction |
| `collectItem()` | Collects 'crystal' at current position | Places a crystal |
| `toggleSwitch()` | Toggles 'switch' at current position | Places a switch |
| `jump()` | Jumps forward over a gap or obstacle | Standard 2-block jump |
| `jumpUp()` | Jumps forward and up 1 unit | |
| `jumpDown()` | Jumps forward and down 1 unit | |
| `say(message)` | Displays a message bubble | No effect on map generation |
| `wait(seconds)` | Pauses execution | No effect on map generation |

## 8. Control Flow & Logic

The template engine supports standard JavaScript control structures which are mapped to Blockly blocks.

### Loops
- **For Loop**: `for (let i = 0; i < n; i++) { ... }`
- **While Loop**: `while (condition) { ... }`

### Logic
- **If/Else**: `if (condition) { ... } else { ... }`
- **Comparison**: `==`, `!=`, `<`, `>`, `<=`, `>=`
- **Boolean**: `&&`, `||`, `!`

## 9. Sensing & Conditions

Use these functions within `if` or `while` conditions to create logic-based challenges.

| Function | Description | Generator Behavior |
|----------|-------------|-------------------|
| `isPathForward()` | Checks if path exists ahead | Always `true` in generator (assumed valid path) |
| `isPathLeft()` | Checks if path exists to left | Random `true/false` |
| `isPathRight()` | Checks if path exists to right | Random `true/false` |
| `isItemPresent(type)` | Checks for item (e.g., `'crystal'`, `'any'`) | Checks/Places item if needed |
| `isSwitchState(state)` | Checks switch (`'on'`, `'off'`) | Checks/Places switch if needed |
| `notDone()` | Checks if NOT at finish | Always `true` until end |

## 10. Math & Variables
- **Operators**: `+`, `-`, `*`, `/`
- **Variables**: Standard JS variables `var`, `let` (global scope)
- **Math Functions**: `random(min, max)`, `Math.floor()`, `Math.abs()`

## 11. Text & Strings
- **Literals**: `"Hello"`, `'World'`
- **Concatenation**: `"a" + "b"` becomes `"ab"`
- **Printing**: `print("msg")` (No-op during generation, useful for debug/player)
- **Text Blocks**: `length` and `create text` logic is valid syntax but effectively acts as string manipulation.

## 12. Procedures (Functions)
- **Definition**: `function myFunc(arg) { ... }`
- **Call**: `myFunc(10)`
- **Return**: Supported in logic.

## 13. Post-Processing

Use `postProcess()` to modify the generated map after the path is created. See [POST_PROCESS.md](./POST_PROCESS.md) for full documentation.

### Available Processors

| Type | Description |
|------|-------------|
| `extendShape` | Creates terrain extensions (squares, mountains) at switch positions |
| `fillBoundingBox` | Fills the map bounding box with blocks (ground/water layer) |
| `addTrees` | Adds tree decorations to non-path positions |

### Example Usage

```js
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

// Add trees to non-path areas
postProcess({ 
    type: 'addTrees', 
    count: [3, 5],
    excludePath: true
});
```

> [!WARNING] **Unsupported Features**
> The Template Interpreter is NOT a full JavaScript engine. The following are **NOT supported** for Map Generation logic (calculating coordinates or loops):
> - **Arrays/Lists**: `[1, 2, 3]` will evaluate to `0` or `undefined`.
> - **Objects**: `{key: val}` will evaluate to `0` or `undefined` when used as values.
> - **Classes/OOP**: Class definitions are not processed.
> - **Complex Native APIs**: `Date`, `Regex`, `String.split()` etc. are not available.
>
> **Exception**: Object literals are supported ONLY as arguments to `postProcess()`.
>
> You can use these features ONLY if they are purely for the Player's code and do not affect the `randomPattern`, `move`, or `collect` logic path.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-13 | Added postProcess section (extendShape, fillBoundingBox, addTrees) |
| 2026-01-10 | Added all filter parameters (_TURN_STYLE_, _TURN_POINT_, etc.) |
| 2026-01-09 | Initial structure guide |

