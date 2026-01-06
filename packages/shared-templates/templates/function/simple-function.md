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
var MIN_PER_CALL = 1;
var MAX_PER_CALL = 3;
var MIN_CALLS = 2;
var MAX_CALLS = 4;
var PER_CALL = random(MIN_PER_CALL, MAX_PER_CALL);
var CALLS = random(MIN_CALLS, MAX_CALLS);

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
