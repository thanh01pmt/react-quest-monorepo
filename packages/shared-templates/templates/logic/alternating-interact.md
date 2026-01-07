---
id: logic-alt-interact
name: "Alternating Interaction"
category: logic
concepts: ["loop", "conditional", "modulo"]
difficulty: 4
tags: ["logic", "parity", "switch", "collect"]
author: system
version: 2
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
var _MIN_PAIRS_ = 2;
var _MAX_PAIRS_ = 4;
var _MIN_SPACE_ = 0;
var _MAX_SPACE_ = 1;

var PAIRS = random(_MIN_PAIRS_, _MAX_PAIRS_);
var SPACE = random(_MIN_SPACE_, _MAX_SPACE_);

// Solution
moveForward();

for (let i = 0; i < PAIRS; i++) {
  // Phase 1: Crystal
  for (let s = 0; s < SPACE + 1; s++) {
    moveForward();
  }
  collectItem();
  
  // Phase 2: Switch
  for (let s = 0; s < SPACE + 1; s++) {
    moveForward();
  }
  toggleSwitch();
}

moveForward();
```
