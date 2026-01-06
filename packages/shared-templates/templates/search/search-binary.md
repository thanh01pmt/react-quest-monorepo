---
id: search-binary
name: "Binary Search Sim"
category: search
concepts: ["loop", "search", "divide_conquer"]
difficulty: 5
tags: ["search", "algorithm", "binary", "logarithmic"]
author: system
version: 1
description: "Go to middle, turn, then collect - simulating binary search"
---

# Binary Search Simulation

A physical representation of the Binary Search logic.

## Academic Concept: Binary Search ($O(log N)$)
- Go to middle.
- Check and collect.
- Go to sub-section.

## Solution & Parameters

```js
// Parameters
var _MIN_DIST_ = 3;
var _MAX_DIST_ = 5;
var DIST = random(_MIN_DIST_, _MAX_DIST_);

// Solution
// 1. Go to Middle
for (let i = 0; i < DIST; i++) {
  moveForward();
}
collectItem();

// 2. Turn and go to sub-section
turnRight();
for (let j = 0; j < DIST / 2; j++) {
  moveForward();
}
collectItem();
```
