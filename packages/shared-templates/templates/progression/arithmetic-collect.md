---
id: arithmetic-collect
name: "Arithmetic Collect"
category: progression
concepts: ["loop", "variable", "arithmetic_progression", "nested_loop"]
difficulty: 4
tags: ["math", "progression", "collect"]
author: system
version: 1
description: "Collect increasing numbers of items (1, 2, 3...)"
---

# Arithmetic Collect

Collect items where the count increases linearly each time.

## Academic Concept: Arithmetic Progression
- Sequence: $a, a+d, a+2d, ...$
- Here: Number of items to collect increases by `STEP`.

## Solution & Parameters

```js
// Parameters
var _MIN_START_ = 1;
var _MAX_START_ = 2;
var START = random(_MIN_START_, _MAX_START_);

var _MIN_STEP_ = 1;
var _MAX_STEP_ = 2;
var STEP = random(_MIN_STEP_, _MAX_STEP_);

var _MIN_GROUPS_ = 3;
var _MAX_GROUPS_ = 4;
var GROUPS = random(_MIN_GROUPS_, _MAX_GROUPS_);

// Solution
moveForward();

for (var i = 0; i < GROUPS; i++) {
  var count = START + i * STEP;
  
  // Atom: Collect Sequence
  for (var j = 0; j < count; j++) {
    collectItem();
    moveForward();
  }
  
  if (i < GROUPS - 1) {
    turnRight();
    moveForward(); // Space between groups
    turnRight();
  }
}
```
