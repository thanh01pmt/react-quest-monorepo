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
var MIN_ZIG_COUNT = 3;
var MAX_ZIG_COUNT = 5;
var ZIG_COUNT = random(MIN_ZIG_COUNT, MAX_ZIG_COUNT);

var MIN_SEGMENT_LENGTH = 2;
var MAX_SEGMENT_LENGTH = 4;
var SEGMENT_LENGTH = random(MIN_SEGMENT_LENGTH, MAX_SEGMENT_LENGTH);

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
