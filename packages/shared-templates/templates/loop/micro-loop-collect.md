---
id: micro-loop-collect
name: "Micro Loop Collect"
category: loop
concepts: ["loop", "repeat", "spacing"]
difficulty: 3
tags: ["loop", "crystal", "repeat"]
author: system
version: 3
description: "Use a loop to collect crystals with turns and spacing"
---

# Micro Loop Collect

A loop-based pattern that collects crystals, turns, and repeats.

## Solution & Parameters

```js
var _MIN_REPEATS_ = 2;
var _MAX_REPEATS_ = 4;
var _MIN_SPACE_ = 0;
var _MAX_SPACE_ = 2;

var REPEATS = random(_MIN_REPEATS_, _MAX_REPEATS_);
var SPACE = random(_MIN_SPACE_, _MAX_SPACE_);

moveForward();

for (let r = 0; r < REPEATS; r++) {
  // Pattern 1
  for (let s = 0; s < SPACE + 1; s++) {
    moveForward();
  }
  collectItem();
  
  // Pattern 2
  for (let s = 0; s < SPACE + 1; s++) {
    moveForward();
  }
  collectItem();
  
  turnRight();
}

moveForward();
collectItem();
moveForward();
```
