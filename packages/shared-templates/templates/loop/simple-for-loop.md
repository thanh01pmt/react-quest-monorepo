---
id: simple-for-loop
name: "Simple FOR Loop"
category: loop
concepts: ["repeat_n"]
difficulty: 2
tags: ["for", "loop", "repeat", "crystal"]
author: system
version: 1
description: "Collect N crystals with random count using a FOR loop"
---

# Simple FOR Loop

Learn to use a FOR loop to repeat actions a specific number of times.

## Learning Goals
- Understand FOR loop syntax
- Use a counter variable
- Repeat actions N times

## Solution & Parameters

```js
// Parameters
var _MIN_CRYSTAL_NUM_ = 3;
var _MAX_CRYSTAL_NUM_ = 6;
var CRYSTAL_NUM = random(_MIN_CRYSTAL_NUM_, _MAX_CRYSTAL_NUM_);

// Solution
// Collect crystals using a loop
moveForward();

for (let i = 0; i < CRYSTAL_NUM; i++) {
  collectItem();
  moveForward();
}

moveForward();
```
