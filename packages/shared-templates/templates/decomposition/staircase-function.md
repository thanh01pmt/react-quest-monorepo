---
id: decomp-stair
name: "Staircase Function"
category: decomposition
concepts: ["function", "procedure"]
difficulty: 3
tags: ["function", "staircase", "automation"]
author: system
version: 1
description: "Use a 'Step' function to climb a staircase"
---

# Staircase Function

Decompose climbing into a single "Step Up" action.

## Academic Concept: Procedural Abstraction
- Abstract "Move, Jump, Move" into "ClimbStep()"

## Solution & Parameters

```js
// Parameters
var MIN_HEIGHT = 3;
var MAX_HEIGHT = 6;
var HEIGHT = random(MIN_HEIGHT, MAX_HEIGHT);

// Solution
function climbStep() {
  moveForward();
  jump();
  moveForward();
  collectItem();
}

// Main
for(let i=0; i<HEIGHT; i++) {
  climbStep();
}
```
