---
id: prog-simple-increase
name: "Simple Increase"
category: progression
concepts: ["variable", "arithmetic_progression"]
difficulty: 2
tags: ["math", "progression", "increment"]
author: system
version: 3
description: "Simple increasing pattern (1, 2, 3 steps)"
---

# Simple Increase

A simple introduction to increasing patterns.

## Learning Goals
- Recognize increasing sequences
- Understand progression

## Solution & Parameters

```js
// Parameters
var _MIN_GROUPS_ = 2;
var _MAX_GROUPS_ = 4;
var GROUPS = random(_MIN_GROUPS_, _MAX_GROUPS_);

// Solution
// Walk 1 step, then 2 steps, then 3 steps, etc.
moveForward();

for (let group = 0; group < GROUPS; group++) {
  let stepsInGroup = group + 1;
  for (let step = 0; step < stepsInGroup; step++) {
    collectItem();
    moveForward();
  }
  
  // Turn for next group (except last)
  if (group < GROUPS - 1) {
    turnRight();
    moveForward();
    turnLeft();
  }
}

moveForward();
```
