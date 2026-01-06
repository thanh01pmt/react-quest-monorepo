---
id: mem-palindrome
name: "Palindrome Path"
category: memory
concepts: ["pattern_recognition", "string_logic"]
difficulty: 4
tags: ["pattern", "palindrome", "symmetry"]
author: system
version: 1
description: "Execute a symmetrical sequence of actions (e.g., Jump-Move-Jump)"
---

# Palindrome Path

A path where the action sequence reads the same backwards and forwards.

## Academic Concept: Palindrome / Symmetry
- Sequence: $A, B, C, B, A$

## Solution & Parameters

```js
// Parameters
var MID_LENGTH = random(1, 3);

// Solution
// Start (A)
jump();
moveForward();

// Middle (B repeated)
for(let i=0; i<MID_LENGTH; i++) {
  collectItem();
  moveForward();
}

// Pivot (C)
turnRight();
moveForward();
turnRight(); // U-Turn effect (conceptually) or just a pivot point in path

// Middle Mirror (B repeated)
for(let i=0; i<MID_LENGTH; i++) {
  collectItem();
  moveForward();
}

// End Mirror (A)
jump();
moveForward();
```
