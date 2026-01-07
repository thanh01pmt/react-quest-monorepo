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

## Solution & Parameters

```js
// Parameters
var _MIN_START_LEN_ = 3;
var _MAX_START_LEN_ = 5;
var START_LEN = random(_MIN_START_LEN_, _MAX_START_LEN_);
var STEP = 1;

// Solution
moveForward();

for (let t = 0; t < START_LEN; t++) {
  let len = START_LEN - t * STEP;
  
  if (len > 0) {
    for (let i = 0; i < len; i++) {
      moveForward();
    }
    collectItem();
    turnLeft();
  }
}

moveForward();
```
