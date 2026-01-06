---
id: decaying-path
name: "Decaying Path"
category: progression
concepts: ["loop", "variable", "arithmetic_progression"]
difficulty: 4
tags: ["math", "decay", "subtraction"]
author: system
version: 1
description: "Start with long segments and decrease length each turn"
---

# Decaying Path

A "convergence" pattern where movements get smaller and smaller.

## Academic Concept: Arithmetic Decay
- Sequence: $a, a-d, a-2d, ...$
- Logic: `dist = MAX - i*STEP`

## Solution & Parameters

```js
// Parameters
var MIN_START_LEN = 4;
var MAX_START_LEN = 6;
var START_LEN = random(MIN_START_LEN, MAX_START_LEN);

var STEP = 1;

// Solution
// Number of segments to draw
let TURNS = START_LEN / STEP;

for (let t = 0; t < TURNS; t++) {
  // Logic: currentLen = START_LEN - t * STEP
  let len = START_LEN - t * STEP;
  
  if (len > 0) {
      for (let i = 0; i < len; i++) {
        moveForward();
      }
      collectItem();
      turnLeft();
  }
}
```
