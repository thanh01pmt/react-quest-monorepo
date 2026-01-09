---
id: arithmetic-move
name: "Arithmetic Move"
category: progression
concepts: ["loop", "variable", "arithmetic_progression"]
difficulty: 3
tags: ["math", "progression", "variable_step"]
author: system
version: 2
description: "Move and collect crystals with increasing distances"
---

# Arithmetic Move

A path where each segment is longer than the previous one by a fixed step.

## Academic Concept: Arithmetic Progression
- Sequence: $a, a+d, a+2d, ...$
- Here: Move distance increases by `STEP` each time.

## Features
- **Arithmetic Progression**: Path segments grow by a constant step.
- **Loop & Variables**: Uses loop variable to calculate length `Start + i*Step`.

## Solution & Parameters

```js
// Parameters
var _MIN_START_ = 2;
var _MAX_START_ = 3;
var _MIN_STEP_ = 1;
var _MAX_STEP_ = 2;
var _MIN_ITERS_ = 3;
var _MAX_ITERS_ = 5;

var START = random(_MIN_START_, _MAX_START_);
var STEP = random(_MIN_STEP_, _MAX_STEP_);
var ITERATIONS = random(_MIN_ITERS_, _MAX_ITERS_);

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal';
var _TURN_STYLE_ = 'straight';
var _TURN_POINT_ = 'null';
var _HAS_JUMP_ = 'noJump';
var _NO_ITEM_AT_ = 'random';
var _SEED_ = random(1, 99999);

// Solution
for (let i = 0; i < ITERATIONS; i++) {
  // Calculate arithmetic length
  let dist = START + i * STEP;
  
  randomPattern(dist, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);
  
  // Turn for next segment (except last)
  if (i < ITERATIONS - 1) {
    turnRight();
  }
}
```
