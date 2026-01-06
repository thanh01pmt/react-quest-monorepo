---
id: mem-undo
name: "Undo Operations"
category: memory
concepts: ["function", "state_machine"]
difficulty: 5
tags: ["memory", "undo", "switch"]
author: system
version: 1
description: "Collect crystals and activate switches, then undo the switches"
---

# Undo Operations

A conceptual task: "Leave everything as you found it".

## Academic Concept: State Reversion
- Forward: `Toggle (Off->On)`
- Backward: `Toggle (On->Off)`

## Solution & Parameters

```js
// Parameters
var _MIN_COUNT_ = 3;
var _MAX_COUNT_ = 5;
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
```
