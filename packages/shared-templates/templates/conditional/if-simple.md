---
id: if-simple
name: "Simple If"
category: conditional
concepts: ["if_simple"]
difficulty: 2
tags: ["conditional", "if", "decision"]
author: system
version: 2
description: "Use simple if statement to collect crystals"
---

# Simple If

Learn to use a simple if statement to make decisions.

## Learning Goals
- Understand if statement
- Make conditional decisions
- Check conditions

## Solution & Parameters

```js
// Parameters
var _MIN_PATH_ = 3;
var _MAX_PATH_ = 5;
var PATH_LEN = random(_MIN_PATH_, _MAX_PATH_);

// Solution
moveForward();

for (let i = 0; i < PATH_LEN; i++) {
  if (isOnCrystal()) {
    collectItem();
  }
  moveForward();
}

moveForward();
```
