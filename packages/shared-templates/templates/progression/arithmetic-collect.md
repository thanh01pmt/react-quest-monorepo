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

## Solution & Parameters

```js
// Parameters
var MIN_START = 1;
var MAX_START = 2;
var START = random(MIN_START, MAX_START);

var MIN_STEP = 1;
var MAX_STEP = 2;
var STEP = random(MIN_STEP, MAX_STEP);

var MIN_GROUPS = 3;
var MAX_GROUPS = 4;
var GROUPS = random(MIN_GROUPS, MAX_GROUPS);

// Solution
moveForward();

for (let i = 0; i < GROUPS - 1; i++) {
  let count = START + i * STEP;
  for (let j = 0; j < count; j++) {
    collectItem();
    moveForward();
  }
  
  turnRight();
  moveForward();
  turnRight();
}

// Last Group (No turn)
let lastCount = START + (GROUPS - 1) * STEP;
for (let k = 0; k < lastCount; k++) {
  collectItem();
  moveForward();
}
```
