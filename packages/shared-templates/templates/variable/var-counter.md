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

## Solution & Parameters

```js
// Parameters
var _MIN_COUNT_ = 3;
var _MAX_COUNT_ = 5;
var COUNT = random(_MIN_COUNT_, _MAX_COUNT_);

// Solution
// Use counter to collect COUNT items
moveForward();

for (let i = 0; i < COUNT; i++) {
  collectItem();
  moveForward();
}
```
