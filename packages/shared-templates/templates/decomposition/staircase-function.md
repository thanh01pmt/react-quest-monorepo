---
id: decomp-stair
name: "Staircase Function"
category: decomposition
concepts: ["function", "procedure"]
difficulty: 3
tags: ["function", "staircase", "automation"]
author: system
version: 2
description: "Use a 'Step' function to climb a staircase"
---

# Staircase Function

Decompose climbing into a single "Step Up" action.

## Academic Concept: Procedural Abstraction
- Abstract "Move, Jump, Move" into "ClimbStep()"

## Features
- **Procedure Call**: Encapsulates logic in `climbStep`.
- **Abstraction**: Hides the complexity of climbing behind a simple function name.

## Solution & Parameters

```js
// Parameters
var _MIN_HEIGHT_ = 3;
var _MAX_HEIGHT_ = 5;
var HEIGHT = random(_MIN_HEIGHT_, _MAX_HEIGHT_);

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key
var _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, random
var _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random
var _HAS_JUMP_ = 'withJump'; // OPTIONS: random, withJump, noJump
var _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth
var _SEED_ = random(1, 99999);

// Solution
function climbStep() {
   // Use randomPattern to generate one valid step segment with jump
   // length 1 implies basically just the jump/landing logic if configured right
   randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);
}

// Main: Climb the staircase
for(let i = 0; i < HEIGHT; i++) {
  climbStep();
}
```
