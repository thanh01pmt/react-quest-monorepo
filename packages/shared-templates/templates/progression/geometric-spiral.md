---
id: geometric-spiral
name: "Geometric Spiral"
category: progression
concepts: ["loop", "variable", "geometric_progression"]
difficulty: 5
tags: ["math", "spiral", "exponential"]
author: system
version: 1
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
var MIN_START = 1;
var MAX_START = 1;
var START = random(MIN_START, MAX_START);

var RATIO = 2; 

var MIN_TURNS = 3;
var MAX_TURNS = 5;
var TURNS = random(MIN_TURNS, MAX_TURNS);

// Solution
let length = START;

for (let i = 0; i < TURNS; i++) {
  // Atom: Move Side
  for (let j = 0; j < length; j++) {
    collectItem(); // Dense interaction for spiral
    moveForward();
  }
  
  turnRight();
  length = length * RATIO;
}
```
