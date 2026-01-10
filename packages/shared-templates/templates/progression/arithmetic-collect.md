---
id: arithmetic-collect
name: "Arithmetic Collect"
category: progression
concepts: ["loop", "variable", "arithmetic_progression", "nested_loop"]
difficulty: 4
tags: ["math", "progression", "collect"]
author: system
version: 1
description: "Collect increasing numbers of items (1, 2, 3...)"
---

# Arithmetic Collect

Collect items where the count increases linearly each time.

## Academic Concept: Arithmetic Progression
- Sequence: $a, a+d, a+2d, ...$
- Here: Number of items to collect increases by `STEP`.

## Features
- **Arithmetic Progression**: The number of items/steps increases by a fixed `STEP` amount each group.
- **Nested Loops**: Inner loop length depends on the outer loop variable.

## Solution & Parameters

```js
// Parameters
var _MIN_START_ = 1;
var _MAX_START_ = 2;
var START = random(_MIN_START_, _MAX_START_);

var _MIN_STEP_ = 1;
var _MAX_STEP_ = 2;
var STEP = random(_MIN_STEP_, _MAX_STEP_);

var _MIN_GROUPS_ = 3;
var _MAX_GROUPS_ = 5;
var GROUPS = random(_MIN_GROUPS_, _MAX_GROUPS_);

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null
var _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null
var _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null
var _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null
var _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null
var _SEED_ = random(1, 99999);

// Solution
for (let i = 0; i < GROUPS; i++) {
  let count = START + i * STEP; // Arithmetic progression
  
  // Generate segment of length 'count'
  randomPattern(count, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);
  
  // Turn logic between groups (except last)
  if (i < GROUPS - 1) {
    turnRight();
    // No extra move needed if randomPattern connects directly, 
    // but typically we want spacing or a "connector" step.
    // randomPattern ends at a cell. Turn happens there.
    // If we duplicate logic from original: "turnRight(); moveForward(); turnRight();" -> U-turn spacing?
    // Let's implement a simple connector move.
    
    // NOTE: Original code was turnRight -> move -> turnRight (U-turnish or Corner?)
    // This implies a "winding" path or "rows". 
    // Let's mimic a simple row switch.
    
    moveForward(); // Connector step
    turnRight();
  }
}
```
