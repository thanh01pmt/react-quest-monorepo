---
id: search-binary
name: "Binary Search Sim"
category: search
concepts: ["conditional", "search", "divide_conquer"]
difficulty: 5
tags: ["search", "algorithm", "binary", "logarithmic"]
author: system
version: 1
description: "Go to middle, check, then go Left or Right (Simulated)"
---

# Binary Search Simulation

A physical representation of the Binary Search logic.

## Academic Concept: Binary Search ($O(log N)$)
- Go to middle.
- If target < current: Go Left.
- If target > current: Go Right.

## Solution & Parameters

```js
// Parameters
var DIST = 4; // Simplified for visual clarity

// Solution
// 1. Go to Middle
for(let i=0; i<DIST; i++) moveForward();

// 2. Check (Simulated split)
// Random decision for the template trace
// 2. Check
// We use 'crystalAhead' to determine which way to go (Generative decision)
if (crystalAhead()) {
   // Found indicator: Go Left
   collectItem(); // Collect indicator
   turnLeft();
   for(let j=0; j<DIST/2; j++) moveForward();
   collectItem();
} else {
   // No indicator: Go Right
   turnRight();
   for(let j=0; j<DIST/2; j++) moveForward();
   collectItem();
}
```
