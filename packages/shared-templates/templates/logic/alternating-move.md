---
id: logic-alt-move
name: "Alternating Move"
category: logic
concepts: ["loop", "conditional", "modulo"]
difficulty: 3
tags: ["logic", "parity", "even_odd"]
author: system
version: 1
description: "Alternate between walking and jumping (Step, Jump, Step, Jump...)"
---

# Alternating Move

A pattern that changes action based on whether the step count is Odd or Even.

## Academic Concept: Parity (Modulo 2)
- Logic: `if (i % 2 == 0) ActionA else ActionB`

## Solution & Parameters

```js
// Parameters
var _MIN_STEPS_ = 4;
var _MAX_STEPS_ = 8;
var STEPS = random(_MIN_STEPS_, _MAX_STEPS_);

// Solution
for (let i = 0; i < STEPS; i++) {
  if (i % 2 == 0) {
    // Even: Walk
    moveForward();
  } else {
    // Odd: Jump
    jump();
  }
}
```
