---
id: var-counter
name: "Counter Variable"
category: variable
concepts: ["counter", "variable"]
difficulty: 2
tags: ["variable", "counter", "accumulator"]
author: system
version: 1
description: "Use a counter variable to track collected crystals"
---

# Counter Variable

Learn to use a variable as a counter to track progress.

## Learning Goals
- Understand variable concept
- Increment a counter
- Use counter in loop

## Features
- **Counter Variable**: Validates that loop count matches variable.
- **Simple Loop**: Standard iteration.

## Solution & Parameters

```js
// Parameters
var _MIN_COUNT_ = 3;
var _MAX_COUNT_ = 6;
var COUNT = random(_MIN_COUNT_, _MAX_COUNT_);

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null
var _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null
var _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null
var _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null
var _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null
var _SEED_ = random(1, 99999);

// Solution
// Use counter to collect COUNT items
for (let i = 0; i < COUNT; i++) {
  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);
}
```
