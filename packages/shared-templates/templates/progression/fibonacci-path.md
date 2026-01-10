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

## Features
- **Math Sequence**: Generates path based on Fibonacci numbers (1, 1, 2, 3, 5...).
- **Variable Update**: Demonstrates updating two variables in a loop.

## Solution & Parameters

```js
// Parameters
var _MIN_STEPS_ = 3;
var _MAX_STEPS_ = 6;
var STEPS = random(_MIN_STEPS_, _MAX_STEPS_);

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key
var _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, random
var _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random
var _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump
var _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth
var _SEED_ = random(1, 99999);

// Solution
let a = 1;
let b = 1;

// First 2 steps (manual or loop) for F_1 and F_2
// Step 1: len 1
randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);
turnRight();

// Step 2: len 1
randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + 1);
turnRight();

// Additional Fibonacci steps (F_3 onwards)
for (let i = 2; i < STEPS; i++) {
  let next = a + b;
  
  // Move Fibonacci distance
  randomPattern(next, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);
  turnRight();
  
  // Update sequence
  a = b;
  b = next;
}
```
