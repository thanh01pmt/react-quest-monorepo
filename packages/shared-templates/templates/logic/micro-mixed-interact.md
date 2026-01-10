---
id: micro-mixed-interact
name: "Micro Mixed Interact"
category: logic
concepts: ["micropattern", "crystal", "switch", "mixed"]
difficulty: 4
tags: ["logic", "crystal", "switch", "interact"]
author: system
version: 5
description: "Collect crystals AND toggle switches with different spacing"
---

# Micro Mixed Interact

Collect crystals and toggle switches.

## Solution & Parameters

```js
## Features
- **Mixed Interaction**: Combines crystals and switches in one path.
- **Variable Spacing**: Uses different random lengths for spacing between different item types.

## Solution & Parameters

```js
// Parameters
var _MIN_REPEATS_ = 2;
var _MAX_REPEATS_ = 4;
var _MIN_SPACE_CRYSTAL_ = 1;
var _MAX_SPACE_CRYSTAL_ = 2;
var _MIN_SPACE_SWITCH_ = 1;
var _MAX_SPACE_SWITCH_ = 2;

var REPEATS = random(_MIN_REPEATS_, _MAX_REPEATS_);
var SPACE_CRYSTAL = random(_MIN_SPACE_CRYSTAL_, _MAX_SPACE_CRYSTAL_);
var SPACE_SWITCH = random(_MIN_SPACE_SWITCH_, _MAX_SPACE_SWITCH_);

// Full Parameter Set (Standardized)
var _TURN_STYLE_ = 'straight';
var _TURN_POINT_ = 'null';
var _HAS_JUMP_ = 'noJump';
var _NO_ITEM_AT_ = 'random';
var _SEED_ = random(1, 99999);

// Solution
for (let i = 0; i < REPEATS; i++) {
  // Phase 1: Crystal Segment
  // Spacing + 1 Item. randomPattern length = Space + 1? No, logic is "Space moves" then "Item".
  // randomPattern(Length) generally distributes items.
  // To strictly enforce "Space then Item", we can do:
  // randomPattern(SPACE_CRYSTAL, 'none', ...) + randomPattern(1, 'crystal', ...)
  
  randomPattern(SPACE_CRYSTAL, 'none', true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, 'true', _SEED_ + (i*4));
  randomPattern(1, 'crystal', true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, 'false', _SEED_ + (i*4)+1);
  
  // Phase 2: Switch Segment
  randomPattern(SPACE_SWITCH, 'none', true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, 'true', _SEED_ + (i*4)+2);
  randomPattern(1, 'switch', true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, 'false', _SEED_ + (i*4)+3);
  
  // Alternate turn direction
  if (i % 2 == 0) {
    turnRight();
    moveForward(); // Connector
    turnRight();
  } else {
    turnLeft();
    moveForward(); // Connector
    turnLeft();
  }
}
```
