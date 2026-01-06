---
id: var-accumulator
name: "Accumulator Variable"
category: variable
concepts: ["accumulator", "variable"]
difficulty: 3
tags: ["variable", "sum", "accumulator"]
author: system
version: 1
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
var _MAX_ROUNDS_ = 4;
var ROUNDS = random(_MIN_ROUNDS_, _MAX_ROUNDS_);

// Solution
// Collect 1, then 2, then 3 crystals per round
moveForward();

for (let round = 1; round <= ROUNDS; round++) {
  for (let i = 0; i < round; i++) {
    collectItem();
    moveForward();
  }
  turnRight();
}
```
