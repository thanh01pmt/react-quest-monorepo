---
id: mem-return
name: "Path Return"
category: memory
concepts: ["function", "stack", "backtracking"]
difficulty: 4
tags: ["memory", "pattern", "inverse"]
author: system
version: 1
description: "Walk a path then return to the start (A -> B -> A)"
---

# Path Return

Walk a random path, stop, turn around, and walk exactly back to the start.

## Academic Concept: Inverse Operations
- Operation: `Move` | Inverse: `Move` (after turning 180)
- Operation: `TurnRight` | Inverse: `TurnLeft`
- Sequence `[A, B, C]` -> Inverse Sequence `[Inv(C), Inv(B), Inv(A)]` (Stack LIFO)

## Solution & Parameters

```js
// Parameters
var _MIN_DIST_ = 2;
var _MAX_DIST_ = 4;
var D1 = random(_MIN_DIST_, _MAX_DIST_);
var D2 = random(_MIN_DIST_, _MAX_DIST_);

// Solution
// Forward Phase
for(let i=0; i<D1; i++) moveForward();
turnRight();
for(let j=0; j<D2; j++) moveForward();

// Return Phase
turnAround();
for(let j=0; j<D2; j++) moveForward();
turnLeft(); // Inverse of TurnRight (viewed from return path is tricky, geometrically: Right -> 180 -> Left returns to origin vec)
for(let i=0; i<D1; i++) moveForward();

turnAround(); // Restore original facing
```
