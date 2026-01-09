---
id: if-simple
name: "Simple If"
category: conditional
concepts: ["if_simple"]
difficulty: 2
tags: ["conditional", "if", "decision"]
author: system
version: 3
description: "Use simple if statement to collect crystals"
---

# Simple If

Learn to use a simple if statement to make decisions.

## Learning Goals
- Understand if statement
- Make conditional decisions
- Check conditions

## Features
- **Simple Decision**: Introduces the `if` block.
- **Random Placement**: Items may or may not be present, requiring the conditional check.

## Solution & Parameters

```js
// Parameters
var _MIN_PATH_ = 3;
var _MAX_PATH_ = 6;
var PATH_LEN = random(_MIN_PATH_, _MAX_PATH_);

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal';
var _TURN_STYLE_ = 'straight';
var _TURN_POINT_ = 'null';
var _HAS_JUMP_ = 'noJump';
var _NO_ITEM_AT_ = 'random'; // Randomly decides if item is there
var _SEED_ = random(1, 99999);

// Solution
for (let i = 0; i < PATH_LEN; i++) {
  // Generate 1-step segment. _NO_ITEM_AT_='random' handles the probability.
  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);
}
```

