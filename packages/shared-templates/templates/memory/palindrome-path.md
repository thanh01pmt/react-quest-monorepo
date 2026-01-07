---
id: mem-palindrome
name: "Palindrome Path"
category: memory
concepts: ["pattern_recognition", "string_logic"]
difficulty: 4
tags: ["pattern", "palindrome", "symmetry"]
author: system
version: 2
description: "Execute a symmetrical sequence of actions (e.g., Jump-Move-Jump)"
---

# Palindrome Path

A path where the action sequence reads the same backwards and forwards.

## Academic Concept: Palindrome / Symmetry
- Sequence: $A, B, C, B, A$

## Solution & Parameters

```js
// Parameters
var _MIN_MID_LENGTH_ = 1;
var _MAX_MID_LENGTH_ = 3;
var MID_LENGTH = random(_MIN_MID_LENGTH_, _MAX_MID_LENGTH_);

// Solution
// Start (A)
moveForward();
jumpUp();

// Middle (B repeated)
for (let i = 0; i < MID_LENGTH; i++) {
  collectItem();
  moveForward();
}

// Pivot (C)
turnRight();
moveForward();
turnRight();

// Middle Mirror (B repeated)
for (let i = 0; i < MID_LENGTH; i++) {
  collectItem();
  moveForward();
}

// End Mirror (A)
jumpDown();
moveForward();
```
