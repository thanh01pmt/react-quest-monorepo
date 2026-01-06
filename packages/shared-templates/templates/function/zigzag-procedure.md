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
var _MIN_COUNT_ = 3;
var _MAX_COUNT_ = 5;
var COUNT = random(_MIN_COUNT_, _MAX_COUNT_);

// Solution
function zigZagStep() {
  moveForward();
  turnRight();
  moveForward();
  turnLeft();
  collectItem();
}

for (let i = 0; i < COUNT; i++) {
  zigZagStep();
}
```
