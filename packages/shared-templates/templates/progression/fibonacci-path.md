---
id: fibonacci-path
name: "Fibonacci Path"
category: progression
concepts: ["loop", "variable", "fibonacci"]
difficulty: 5
tags: ["math", "fibonacci", "nature"]
author: system
version: 1
description: "Walk distances following the Fibonacci sequence (1, 1, 2, 3, 5...)"
---

# Fibonacci Path

A path based on the famous Fibonacci sequence found in nature.

## Academic Concept: Fibonacci Sequence
- $F_0=0, F_1=1, F_n = F_{n-1} + F_{n-2}$
- Sequence: 1, 1, 2, 3, 5, 8...

## Solution & Parameters

```js
// Parameters
var MIN_STEPS = 4;
var MAX_STEPS = 6;
var STEPS = random(MIN_STEPS, MAX_STEPS);

// Solution
let a = 1;
let b = 1;

// First step (1)
moveForward();
collectItem();
turnRight();

// Second step (1)
moveForward();
collectItem();
turnRight();

for (let i = 2; i < STEPS; i++) {
  let next = a + b;
  
  // Atom: Move Fibonacci Dist
  for (let j = 0; j < next; j++) {
    moveForward();
  }
  collectItem();
  turnRight();
  
  // Update sequence
  a = b;
  b = next;
}
```
