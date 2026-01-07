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

## Solution & Parameters

```js
// Parameters
var _MIN_ROUNDS_ = 2;
var _MAX_ROUNDS_ = 3;
var ROUNDS = random(_MIN_ROUNDS_, _MAX_ROUNDS_);

// Solution
// Collect 1, then 2, then 3 crystals per round (zigzag path)
moveForward();

for (let round = 0; round < ROUNDS; round++) {
  let collectCount = round + 1;
  for (let i = 0; i < collectCount; i++) {
    collectItem();
    moveForward();
  }
  
  // Alternate turn direction to create zigzag (not circular)
  if (round % 2 == 0) {
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
