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

## Features
- **Complex Pattern**: Creates a zigzag path by combining segments and turns.
- **Alternating Direction**: Demonstrates logic to switch turn direction (Left <-> Right).
- **Loop**: Repeats the zigzag logic multiple times.

## Solution & Parameters

```js
// Parameters
var _MIN_ZIG_COUNT_ = 3;
var _MAX_ZIG_COUNT_ = 5;
var ZIG_COUNT = random(_MIN_ZIG_COUNT_, _MAX_ZIG_COUNT_);
var SEG_LEN = 3;

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal';
var _TURN_STYLE_ = 'straight'; 
var _TURN_POINT_ = 'null';
var _HAS_JUMP_ = 'noJump';
var _NO_ITEM_AT_ = 'random';
var _SEED_ = random(1, 99999);

// Solution
for (let i = 0; i < ZIG_COUNT; i++) {
  // Generate segment
  randomPattern(SEG_LEN, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);
  
  // Alternate turns: Even -> Right, Odd -> Left
  if (i % 2 == 0) {
    turnRight();
  } else {
    turnLeft();
  }
}
```
