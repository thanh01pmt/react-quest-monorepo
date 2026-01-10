---
id: geometric-spiral
name: "Geometric Spiral"
category: progression
concepts: ["loop", "variable", "geometric_progression"]
difficulty: 5
tags: ["math", "spiral", "exponential"]
author: system
version: 3
description: "Walk a spiral where side lengths double (1, 2, 4...)"
---

# Geometric Spiral

A spiral path that expands exponentially.

## Academic Concept: Geometric Progression
- Sequence: $a, ar, ar^2, ...$
- Here: Side length multiplies by `RATIO` (usually 2) each turn.

## Features
- **Geometric Progression**: Demonstrates exponential properties (doubling length).
- **Spiral**: Creates an expanding spiral path.

## Solution & Parameters

```js
// Parameters
var _MIN_TURNS_ = 3;
var _MAX_TURNS_ = 5;
var TURNS = random(_MIN_TURNS_, _MAX_TURNS_);
var RATIO = 2;

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null
var _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null
var _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null
var _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null
var _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null
var _SEED_ = random(1, 99999);

// Solution
let length = 1;

for (let i = 0; i < TURNS; i++) {
  // Generate expanding segment
  randomPattern(length, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);
  
  turnRight();
  
  // Clean arithmetic update
  length = length * RATIO;
}
```
