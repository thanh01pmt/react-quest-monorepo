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

## Solution & Parameters

```js
// Parameters
var _MIN_COUNT_ = 2;
var _MAX_COUNT_ = 4;
var COUNT = random(_MIN_COUNT_, _MAX_COUNT_);

// Helper function
function turnAround() {
  turnRight();
  turnRight();
}

// Solution
// 1. Activate and Collect
for (let i = 0; i < COUNT; i++) {
  moveForward();
  collectItem();
  toggleSwitch();
}

// 2. Turn Around
turnAround();

// 3. Deactivate (Undo)
for (let i = 0; i < COUNT; i++) {
  toggleSwitch();
  moveForward();
}

// 4. Advance to Finish (ensures Finish ≠ Start)
turnRight();
moveForward();
collectItem();
moveForward();
```

