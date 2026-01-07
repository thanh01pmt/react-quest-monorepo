---
id: logic-alt-move
name: "Alternating Move"
category: logic
concepts: ["loop", "conditional", "modulo"]
difficulty: 3
tags: ["logic", "parity", "even_odd"]
author: system
version: 2
description: "Alternate between walking and jumping, collecting crystals"
---

# Alternating Move

A pattern that changes action based on whether the step count is Odd or Even.

## Academic Concept: Parity (Modulo 2)
- Logic: `if (i % 2 == 0) ActionA else ActionB`

## Solution & Parameters

```js
// Parameters
var _MIN_PAIRS_ = 2;
var _MAX_PAIRS_ = 4;
var PAIRS = random(_MIN_PAIRS_, _MAX_PAIRS_);

// Solution
moveForward();

for (let i = 0; i < PAIRS; i++) {
  // Even: Walk
  moveForward();
  collectItem();
  
  // Odd: Jump Up
  jumpUp();
  collectItem();
}

moveForward();
```
