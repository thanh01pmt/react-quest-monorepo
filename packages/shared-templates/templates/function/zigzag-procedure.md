---
id: zigzag-procedure
name: "Zigzag Procedure"
category: function
concepts: ["procedure_simple"]
difficulty: 4
tags: ["procedure", "function", "zigzag"]
author: system
version: 1
description: "Create a reusable function to move in a zigzag"
---

# Zigzag Procedure

Define a function for a complex movement pattern and reuse it.

## Solution & Parameters

```js
// Parameters
var MIN_COUNT = 3;
var MAX_COUNT = 5;
var COUNT = random(MIN_COUNT, MAX_COUNT);

// Solution
function zigZagStep() {
  moveForward();
  turnRight();
  moveForward();
  turnLeft();
  collectItem();
}

moveForward();

for (let i = 0; i < COUNT; i++) {
  zigZagStep();
}

moveForward();
```
