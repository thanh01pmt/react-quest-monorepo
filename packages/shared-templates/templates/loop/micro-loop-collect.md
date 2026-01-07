---
id: micro-loop-collect
name: "Micro Loop Collect"
category: loop
concepts: ["loop", "repeat", "spacing"]
difficulty: 3
tags: ["loop", "crystal", "repeat"]
author: system
version: 4
description: "Use a loop to collect crystals with turns and spacing"
---

# Micro Loop Collect

A loop-based pattern that collects crystals, turns, and repeats.

## Solution & Parameters

```js
var _MIN_REPEATS_ = 2;
var _MAX_REPEATS_ = 3;
var _MIN_SPACE_ = 0;
var _MAX_SPACE_ = 2;

var REPEATS = random(_MIN_REPEATS_, _MAX_REPEATS_);
var SPACE = random(_MIN_SPACE_, _MAX_SPACE_);

moveForward();

// Zigzag pattern to avoid circular path
for (let r = 0; r < REPEATS; r++) {
  // Collect phase
  for (let s = 0; s < SPACE + 1; s++) {
    moveForward();
  }
  collectItem();
  
  for (let s = 0; s < SPACE + 1; s++) {
    moveForward();
  }
  collectItem();
  
  // Alternate turn direction
  if (r % 2 == 0) {
    turnRight();
    moveForward();
    turnRight();
  } else {
    turnLeft();
    moveForward();
    turnLeft();
  }
}

// Final exit
collectItem();
moveForward();
```
