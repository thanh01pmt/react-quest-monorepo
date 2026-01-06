---
id: logic-3-way
name: "Three-Way Cycle"
category: logic
concepts: ["loop", "conditional", "modulo"]
difficulty: 5
tags: ["logic", "modulo", "cycle", "pattern"]
author: system
version: 1
description: "A repeating cycle of 3 actions: Move -> Jump -> Collect"
---

# Three-Way Cycle

A pattern that repeats every 3 steps, teaching Modulo 3 logic.

## Academic Concept: Modulo N
- Case 0: Action A
- Case 1: Action B
- Case 2: Action C

## Solution & Parameters

```js
// Parameters
var MIN_CYCLES = 2;
var MAX_CYCLES = 4;
var CYCLES = random(MIN_CYCLES, MAX_CYCLES);
var STEPS = CYCLES * 3;

// Solution
for (let i = 0; i < CYCLES; i++) {
  // Case 0: Move
  moveForward();
  
  // Case 1: Jump
  jump();
  
  // Case 2: Collect & Move
  collectItem();
  moveForward();
}
```
