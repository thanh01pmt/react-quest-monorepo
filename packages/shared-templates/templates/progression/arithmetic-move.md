---
id: arithmetic-move
name: "Arithmetic Move"
category: progression
concepts: ["loop", "variable", "arithmetic_progression"]
difficulty: 3
tags: ["math", "progression", "variable_step"]
author: system
version: 1
description: "Move distances that increase linearly (1, 2, 3...)"
---

# Arithmetic Move

A path where each segment is longer than the previous one by a fixed step.

## Academic Concept: Arithmetic Progression
- Sequence: $a, a+d, a+2d, ...$
- Here: Move distance increases by `STEP` each time.

## Solution & Parameters

```js
// Parameters
var _MIN_START_ = 1;
var _MAX_START_ = 2;
var START = random(_MIN_START_, _MAX_START_);

var _MIN_STEP_ = 1;
var _MAX_STEP_ = 1;
var STEP = random(_MIN_STEP_, _MAX_STEP_);

var _MIN_ITERATIONS_ = 3;
var _MAX_ITERATIONS_ = 4;
var ITERATIONS = random(_MIN_ITERATIONS_, _MAX_ITERATIONS_);

// Solution
for (let i = 0; i < ITERATIONS; i++) {
  let dist = START + i * STEP;
  // Move 'dist' steps
  // e.g. 2, 4, 6...
  
  // Atom: Move
  for (let j = 0; j < dist; j++) {
    moveForward();
  }
  
  if (i < ITERATIONS - 1) {
    turnRight();
  }
}
```
