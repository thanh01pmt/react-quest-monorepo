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
var MIN_PAIRS = 3;
var MAX_PAIRS = 5;
var PAIRS = random(MIN_PAIRS, MAX_PAIRS);
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
