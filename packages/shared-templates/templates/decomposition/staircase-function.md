---
id: decomp-stair
name: "Staircase Function"
category: decomposition
concepts: ["function", "procedure"]
difficulty: 3
tags: ["function", "staircase", "automation"]
author: system
version: 2
description: "Use a 'Step' function to climb a staircase"
---

# Staircase Function

Decompose climbing into a single "Step Up" action.

## Academic Concept: Procedural Abstraction
- Abstract "Move, Jump, Move" into "ClimbStep()"

## Solution & Parameters

```js
// Parameters
var _MIN_HEIGHT_ = 2;
var _MAX_HEIGHT_ = 4;
var HEIGHT = random(_MIN_HEIGHT_, _MAX_HEIGHT_);

// Solution
function climbStep() {
  moveForward();
  jumpUp();
  collectItem();
}

// Main
moveForward();

for(let i = 0; i < HEIGHT; i++) {
  climbStep();
}

moveForward();
```
