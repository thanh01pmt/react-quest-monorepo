---
id: var-accumulator
name: "Accumulator Variable"
category: variable
concepts: ["accumulator", "variable"]
difficulty: 3
tags: ["variable", "sum", "accumulator"]
author: system
version: 3
description: "Use an accumulator to collect increasing amounts"
---

# Accumulator Variable

Use a variable to accumulate values (like sum = sum + i).

## Learning Goals
- Understand accumulator pattern
- Update variable inside loop
- Track running total

## Features
- **Accumulator Pattern**: Length of segment increases each round (1, 2, 3...).
- **Variable Update**: Demonstrates `collectCount` derived from loop variable.

## Solution & Parameters

```js
// Parameters
var _MIN_ROUNDS_ = 3;
var _MAX_ROUNDS_ = 5;
var ROUNDS = random(_MIN_ROUNDS_, _MAX_ROUNDS_);

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal';
var _TURN_STYLE_ = 'straight';
var _TURN_POINT_ = 'null';
var _HAS_JUMP_ = 'noJump';
var _NO_ITEM_AT_ = 'random';
var _SEED_ = random(1, 99999);

// Solution
for (let round = 0; round < ROUNDS; round++) {
  let collectCount = round + 1; // Accumulator / increasing value
  
  // Generate segment of increasing length
  randomPattern(collectCount, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + round);
  
  // Alternate turn direction to create zigzag
  if (round % 2 == 0) {
    turnRight();
  } else {
    turnLeft();
  }
}
```
