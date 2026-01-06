---
id: simple-sequence
name: "Simple Sequence"
category: sequential
concepts: ["sequential"]
difficulty: 1
tags: ["moveForward", "collectItem", "basic", "sequence"]
author: system
version: 1
description: "Sequential commands without loops - basic movement and collection"
---

# Simple Sequence

Learn the basics of sequential programming by executing commands in order.

## Learning Goals
- Understand sequential execution
- Practice basic commands
- Learn that each command runs one after another

## Solution & Parameters

```js
// Parameters
var MIN_STEPS = 3;
var MAX_STEPS = 5;
var STEPS = random(MIN_STEPS, MAX_STEPS);

// Solution
// Simple sequence of move and collect
moveForward();

for (let i = 0; i < STEPS; i++) {
  moveForward();
  collectItem();
}
moveForward();
```
