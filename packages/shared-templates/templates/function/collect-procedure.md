---
id: collect-procedure
name: "Collect Procedure"
category: function
concepts: ["procedure_simple"]
difficulty: 4
tags: ["procedure", "function", "reuse"]
author: system
version: 1
description: "Create and use a procedure for collecting items"
---

# Collect Procedure

Create a reusable procedure for the collect-and-move pattern.

## Learning Goals
- Define custom procedures
- Call procedures to reduce code
- Understand code reuse

## Solution & Parameters

```js
// Parameters
var MIN_COLLECTION_COUNT = 3;
var MAX_COLLECTION_COUNT = 6;
var COLLECTION_COUNT = random(MIN_COLLECTION_COUNT, MAX_COLLECTION_COUNT);

// Solution
function collectAndMove() {
  collectItem();
  moveForward();
}

// Use the procedure
moveForward();

for (let i = 0; i < COLLECTION_COUNT; i++) {
  collectAndMove();
}

moveForward();
```
