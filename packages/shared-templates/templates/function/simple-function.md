---
id: simple-function
name: "Simple Function"
category: function
concepts: ["procedure_simple"]
difficulty: 3
tags: ["function", "procedure", "reuse", "define"]
author: system
version: 1
description: "Define and call a simple function"
---

# Simple Function

Learn to define and call functions to organize your code.

## Learning Goals
- Define a function
- Call a function multiple times
- Understand code reuse

## Solution & Parameters

```js
// Parameters
var _MIN_PER_CALL_ = 1;
var _MAX_PER_CALL_ = 3;
var _MIN_CALLS_ = 2;
var _MAX_CALLS_ = 4;
var PER_CALL = random(_MIN_PER_CALL_, _MAX_PER_CALL_);
var CALLS = random(_MIN_CALLS_, _MAX_CALLS_);

// Solution
function collectItems() {
  for (let i = 0; i < PER_CALL; i++) {
    collectItem();
    moveForward();
  }
}

moveForward();

for (let c = 0; c < CALLS; c++) {
  collectItems();
  turnRight();
}

moveForward();
```
