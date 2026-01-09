---
id: mem-return
name: "Path Return"
category: memory
concepts: ["function", "stack", "backtracking"]
difficulty: 4
tags: ["memory", "pattern", "inverse"]
author: system
version: 1
description: "Walk a path, collect crystal at destination, return, then advance to finish"
---

# Path Return

Walk a random path, collect crystal at destination, turn around, return to start, then move to finish.

## Academic Concept: Inverse Operations
- Operation: `Move` | Inverse: `Move` (after turning 180)
- Operation: `TurnRight` | Inverse: `TurnLeft`
- Sequence `[A, B, C]` -> Inverse Sequence `[Inv(C), Inv(B), Inv(A)]` (Stack LIFO)

## Features
- **Inverse Operations**: To return, one must reverse the path and turns.
- **Stack Logic**: Last-in, First-out concept applied to movement.

## Solution & Parameters

```js
// Parameters
var _MIN_DIST_ = 2;
var _MAX_DIST_ = 4;
var D1 = random(_MIN_DIST_, _MAX_DIST_);
var D2 = random(_MIN_DIST_, _MAX_DIST_);

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal';
var _TURN_STYLE_ = 'straight';
var _TURN_POINT_ = 'null';
var _HAS_JUMP_ = 'noJump';
var _NO_ITEM_AT_ = 'random';
var _SEED_ = random(1, 99999);

// Helper function
function turnAround() {
  turnRight();
  turnRight();
}

// Solution
// Forward Phase
// D1 Segment
randomPattern(D1, 'none', false, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, 'true', _SEED_); // No items on path
turnRight();
// D2 Segment
randomPattern(D2, 'none', false, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, 'true', _SEED_ + 1);

// Collect at destination
collectItem();

// Return Phase
turnAround();
// Return D2
for(let j=0; j<D2; j++) moveForward(); // Simple return
turnLeft();
// Return D1
for(let i=0; i<D1; i++) moveForward(); // Simple return

// Advance to Finish (ensures Finish ≠ Start)
turnLeft();
randomPattern(2, 'crystal', true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, 'false', _SEED_ + 99);
```

