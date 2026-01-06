---
id: micro-zigzag-collect
name: "Micro Zigzag Collect"
category: loop
concepts: ["zigzag", "turns", "alternating"]
difficulty: 4
tags: ["loop", "zigzag", "crystal"]
author: system
version: 4
description: "Collect crystals in a zigzag pattern with alternating turns"
---

# Micro Zigzag Collect

Zigzag path with alternating left/right turns.

## Solution & Parameters

```js
var _MIN_PAIRS_ = 1;
var _MAX_PAIRS_ = 3;
var _SEGMENT_LENGTH_ = 2;

var PAIRS = random(_MIN_PAIRS_, _MAX_PAIRS_);

moveForward();

for (let p = 0; p < PAIRS; p++) {
  // === Segment 1 (Right Turn) ===
  for (let s1 = 0; s1 < _SEGMENT_LENGTH_; s1++) {
    moveForward();
  }
  collectItem();
  
  // Turn Right Sequence
  turnRight();
  moveForward();
  turnRight();
  
  // === Segment 2 (Left Turn) ===
  for (let s2 = 0; s2 < _SEGMENT_LENGTH_; s2++) {
    moveForward();
  }
  collectItem();
  
  // Turn Left Sequence (prepare for next pair, or end facing forward)
  turnLeft();
  moveForward();
  turnLeft();
}

moveForward();
```
