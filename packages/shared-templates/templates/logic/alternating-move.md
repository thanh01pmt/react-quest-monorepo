---
id: logic-alt-move
name: "Alternating Move"
category: logic
concepts: ["loop", "conditional", "modulo"]
difficulty: 3
tags: ["logic", "parity", "even_odd"]
author: system
version: 1
description: "Alternate between walking and jumping, collecting crystals"
---

# Alternating Move

A pattern that changes action based on whether the step count is Odd or Even.

## Academic Concept: Parity (Modulo 2)
- Logic: `if (i % 2 == 0) ActionA else ActionB`

## Solution & Parameters

```js
// Parameters
var MIN_PAIRS = 2;
var MAX_PAIRS = 4;
var STEPS = 2 * random(MIN_PAIRS, MAX_PAIRS);

// Solution
for (let i = 0; i < STEPS / 2; i++) {
  // Even: Walk
  moveForward();
  collectItem();
  
  // Odd: Jump
  jump();
  collectItem();
}
```
