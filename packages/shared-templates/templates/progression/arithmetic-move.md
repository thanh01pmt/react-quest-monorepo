---
id: arithmetic-move
name: "Arithmetic Move"
category: progression
concepts: ["loop", "variable", "arithmetic_progression"]
difficulty: 3
tags: ["math", "progression", "variable_step"]
author: system
version: 1
description: "Move and collect crystals with increasing distances"
---

# Arithmetic Move

A path where each segment is longer than the previous one by a fixed step.

## Academic Concept: Arithmetic Progression
- Sequence: $a, a+d, a+2d, ...$
- Here: Move distance increases by `STEP` each time.

## Solution & Parameters

```js
// Parameters
var MIN_START = 1;
var MAX_START = 2;
var START = random(MIN_START, MAX_START);

var MIN_STEP = 1;
var MAX_STEP = 1;
var STEP = random(MIN_STEP, MAX_STEP);

var MIN_ITERATIONS = 3;
var MAX_ITERATIONS = 4;
var ITERATIONS = random(MIN_ITERATIONS, MAX_ITERATIONS);

// Solution
for (let i = 0; i < ITERATIONS - 1; i++) {
  let dist = START + i * STEP;
  for (let j = 0; j < dist; j++) {
    moveForward();
  }
  collectItem();
  turnRight();
}

// Last Segment (No turn)
let lastDist = START + (ITERATIONS - 1) * STEP;
for (let k = 0; k < lastDist; k++) {
  moveForward();
}
collectItem();
```
