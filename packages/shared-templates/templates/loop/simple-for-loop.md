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
var MIN_CRYSTAL_NUM = 3;
var MAX_CRYSTAL_NUM = 6;
var CRYSTAL_NUM = random(MIN_CRYSTAL_NUM, MAX_CRYSTAL_NUM);
var SPACE = 1; // Default spacing

// Solution
// Collect crystals using a loop
moveForward();

for (let i = 0; i < CRYSTAL_NUM; i++) {
  collectItem();
  
  // Zig-Zag movement
  turnLeft();
  moveForward();
  turnRight();
  moveForward();
  
  // Extra Spacing if needed
  for(let j=0; j<SPACE; j++) {
    moveForward();
  }
}

moveForward();
```
