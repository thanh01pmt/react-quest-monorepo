---
id: mem-undo
name: "Undo Operations"
category: memory
concepts: ["function", "state_machine"]
difficulty: 5
tags: ["memory", "undo", "switch"]
author: system
version: 1
description: "Collect crystals and activate switches, then undo the switches and advance to finish"
---

# Undo Operations

A conceptual task: "Leave everything as you found it", then proceed to finish.

## Academic Concept: State Reversion
- Forward: `Toggle (Off->On)`
- Backward: `Toggle (On->Off)`

## Features
- **State Reversion**: Toggling a switch twice returns it to original state.
- **Backtracking**: Retracing steps while undoing actions.

## Solution & Parameters

```js
// Parameters
var _MIN_COUNT_ = 2;
var _MAX_COUNT_ = 4;
var COUNT = random(_MIN_COUNT_, _MAX_COUNT_);

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null
var _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null
var _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null
var _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null
var _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null
var _SEED_ = random(1, 99999);

// Helper function
function turnAround() {
  turnRight();
  turnRight();
}

// Solution
// 1. Activate and Collect
for (let i = 0; i < COUNT; i++) {
  // Move and Interact
  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);
}

// 2. Turn Around
turnAround();

// 3. Deactivate (Undo)
for (let i = 0; i < COUNT; i++) {
  // Simple retrace interact
  toggleSwitch();
  moveForward();
}

// 4. Advance to Finish (ensures Finish ≠ Start)
turnRight();
randomPattern(2, 'crystal', true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, 'random', _SEED_ + 99);
```

