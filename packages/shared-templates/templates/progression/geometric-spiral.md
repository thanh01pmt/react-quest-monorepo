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

## Solution & Parameters

```js
// Parameters
var _MIN_TURNS_ = 2;
var _MAX_TURNS_ = 3;
var TURNS = random(_MIN_TURNS_, _MAX_TURNS_);
var RATIO = 2;

// Solution
moveForward();

let length = 1;

for (let i = 0; i < TURNS; i++) {
  // Move side and collect
  for (let j = 0; j < length; j++) {
    collectItem();
    moveForward();
  }
  
  turnRight();
  length = length * RATIO;
}

// Final side without turn (exit)
for (let j = 0; j < length; j++) {
  collectItem();
  moveForward();
}

moveForward();
```
