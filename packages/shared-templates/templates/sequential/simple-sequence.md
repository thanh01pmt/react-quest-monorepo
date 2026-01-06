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
var _MIN_STEPS_ = 3;
var _MAX_STEPS_ = 5;
var STEPS = random(_MIN_STEPS_, _MAX_STEPS_);

// Solution
// Simple sequence of move and collect
for (let i = 0; i < STEPS; i++) {
  moveForward();
  collectItem();
}
moveForward();
```
