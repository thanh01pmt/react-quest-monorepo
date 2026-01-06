---
id: zigzag-path
name: "Zigzag Path"
category: loop
concepts: ["repeat_n"]
difficulty: 4
tags: ["repeat", "turn", "zigzag"]
author: system
version: 1
description: "Navigate a zigzag path and collect crystals at turns"
---

# Zigzag Path

Navigate through a zigzag path by repeating the turn-forward pattern.

## Learning Goals
- Use repeat with multiple commands  
- Understand turn directions
- Recognize zigzag pattern

## Solution & Parameters

```js
// Parameters
var _MIN_ZIG_COUNT_ = 3;
var _MAX_ZIG_COUNT_ = 5;
var ZIG_COUNT = random(_MIN_ZIG_COUNT_, _MAX_ZIG_COUNT_);

var _MIN_SEGMENT_LENGTH_ = 2;
var _MAX_SEGMENT_LENGTH_ = 4;
var SEGMENT_LENGTH = random(_MIN_SEGMENT_LENGTH_, _MAX_SEGMENT_LENGTH_);

// Solution
// Navigate zigzag
moveForward();

for (let i = 0; i < ZIG_COUNT; i++) {
  for (let j = 0; j < SEGMENT_LENGTH; j++) {
    moveForward();
  }
  collectItem();
  turnRight();
  moveForward();
  turnLeft();
}

collectItem();
moveForward();
```
