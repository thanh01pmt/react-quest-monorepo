---
id: zigzag-path
name: "Zigzag Path"
category: loop
concepts: ["repeat_n"]
difficulty: 4
tags: ["repeat", "turn", "zigzag"]
author: system
version: 1
description: "Navigate a zigzag path with turning pattern"
---

# Zigzag Path

Navigate through a zigzag path by repeating the turn-forward pattern.

## Learning Goals
- Use repeat with multiple commands
- Understand turn directions
- Recognize zigzag pattern

## Parameters

```js
var _ZIG_COUNT_ = 3;
var _SEGMENT_LENGTH_ = 2;
```

## Solution Code

```js
// Navigate zigzag
for (let i = 0; i < _ZIG_COUNT_; i++) {
  for (let j = 0; j < _SEGMENT_LENGTH_; j++) {
    moveForward();
  }
  turnRight();
  moveForward();
  turnLeft();
}
