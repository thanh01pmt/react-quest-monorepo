---
id: logic-simple-parity
name: "Simple Parity"
category: logic
concepts: ["conditional", "modulo"]
difficulty: 2
tags: ["logic", "parity", "even_odd"]
author: system
version: 1
description: "Simple alternating pattern - collect every other step"
---

# Simple Parity

A simple introduction to parity (even/odd) logic.

## Learning Goals
- Understand even/odd pattern
- Recognize alternating sequences

## Solution & Parameters

```js
// Parameters
var _MIN_STEPS_ = 4;
var _MAX_STEPS_ = 6;
var STEPS = random(_MIN_STEPS_, _MAX_STEPS_);

// Solution
// Collect at every other position
moveForward();

for (let i = 0; i < STEPS; i++) {
  collectItem();
  moveForward();
  moveForward();
}
```
