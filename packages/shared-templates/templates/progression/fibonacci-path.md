---
id: fibonacci-path
name: "Fibonacci Path"
category: progression
concepts: ["loop", "variable", "fibonacci"]
difficulty: 5
tags: ["math", "fibonacci", "nature"]
author: system
version: 3
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
var _MIN_STEPS_ = 2;
var _MAX_STEPS_ = 3;
var STEPS = random(_MIN_STEPS_, _MAX_STEPS_);

// Solution
let a = 1;
let b = 1;

// Initial entry
moveForward();

// First step (distance 1)
moveForward();
collectItem();
turnRight();

// Second step (distance 1)
moveForward();
collectItem();
turnRight();

// Additional Fibonacci steps
for (let i = 2; i < STEPS + 1; i++) {
  let next = a + b;
  
  // Move Fibonacci distance
  for (let j = 0; j < next; j++) {
    moveForward();
  }
  collectItem();
  turnRight();
  
  // Update sequence
  a = b;
  b = next;
}

// Final exit segment (no turn, just continue forward)
for (let j = 0; j < b; j++) {
  collectItem();
  moveForward();
}

moveForward();
```
