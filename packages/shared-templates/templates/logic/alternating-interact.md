---
id: logic-alt-interact
name: "Alternating Interaction"
category: logic
concepts: ["loop", "conditional", "modulo"]
difficulty: 4
tags: ["logic", "parity", "switch", "collect"]
author: system
version: 1
description: "Alternate between collecting Item and toggling Switch"
---

# Alternating Interaction

A complex task requiring the student to recognize two interleaved patterns.

## Academic Concept: Parity (Modulo 2)
- Even steps: Collect Crystal
- Odd steps: Toggle Switch

## Solution & Parameters

```js
// Parameters
var _MIN_PAIRS_ = 3;
var _MAX_PAIRS_ = 5;
var PAIRS = random(_MIN_PAIRS_, _MAX_PAIRS_);
var STEPS = PAIRS * 2;

// Solution
for (let i = 0; i < PAIRS; i++) {
  // Even Step (Crystal)
  moveForward();
  collectItem();
  
  // Odd Step (Switch)
  moveForward();
  toggleSwitch();
}
```
