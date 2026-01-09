---
id: decaying-path
name: "Decaying Path"
category: progression
concepts: ["loop", "variable", "arithmetic_progression"]
difficulty: 4
tags: ["math", "decay", "subtraction"]
author: system
version: 2
description: "Start with long segments and decrease length each turn"
---

# Decaying Path

A "convergence" pattern where movements get smaller and smaller.

## Academic Concept: Arithmetic Decay
- Sequence: $a, a-d, a-2d, ...$
- Logic: `dist = MAX - i*STEP`

## Features
- **Arithmetic Decay**: Demonstrates decreasing value over time.
- **Dynamic Pattern**: Uses `randomPattern` with a variable length argument.

## Solution & Parameters

```js
// Parameters
var _MIN_START_LEN_ = 3;
var _MAX_START_LEN_ = 5;
var START_LEN = random(_MIN_START_LEN_, _MAX_START_LEN_);
var STEP = 1;

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal';
var _TURN_STYLE_ = 'straight';
var _TURN_POINT_ = 'null';
var _HAS_JUMP_ = 'noJump';
var _NO_ITEM_AT_ = 'random';
var _SEED_ = random(1, 99999);

// Solution
for (let t = 0; t < START_LEN; t++) {
  // Calculate decaying length
  let len = START_LEN - t * STEP;
  
  if (len > 0) {
    // Generate segment of specific calculated length
    randomPattern(len, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + t);
    
    turnLeft();
  }
}
```
