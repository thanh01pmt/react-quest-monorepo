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
var _MIN_START_ = 1;
var _MAX_START_ = 1;
var START = random(_MIN_START_, _MAX_START_);

var RATIO = 2; 

var _MIN_TURNS_ = 3;
var _MAX_TURNS_ = 5;
var TURNS = random(_MIN_TURNS_, _MAX_TURNS_);

// Solution
var length = START;

for (var i = 0; i < TURNS; i++) {
  // Atom: Move Side
  for (var j = 0; j < length; j++) {
    collectItem(); // Dense interaction for spiral
    moveForward();
  }
  
  turnRight();
  length = length * RATIO;
}
```
