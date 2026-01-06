---
id: mem-undo
name: "Undo Operations"
category: memory
concepts: ["function", "state_machine"]
difficulty: 5
tags: ["memory", "undo", "switch"]
author: system
version: 1
description: "Turn switches ON while going forward, TURN them OFF while returning"
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

// Solution
// 1. Activate
for (var i = 0; i < COUNT; i++) {
  moveForward();
  toggleSwitch();
}

// 2. Turn Around
turnAround();

// 3. Deactivate (Undo)
for (var i = 0; i < COUNT; i++) {
  toggleSwitch(); // Order: Toggle (at current pos) then Move back? 
  // Wait, if we moved forward then toggle, we are ON the switch.
  // After turn around, we are still ON the switch.
  // So: Toggle, then Move.
  moveForward();
}
```
