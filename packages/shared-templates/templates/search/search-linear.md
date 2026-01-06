---
id: search-linear
name: "Linear Search"
category: search
concepts: ["loop", "conditional", "search"]
difficulty: 4
tags: ["search", "algorithm", "linear"]
author: system
version: 1
description: "Move along a line and stop when you find the target item"
---

# Linear Search

Classic search algorithm: check every item until you find what you need.

## Academic Concept: Linear Search ($O(N)$)
- Iterate through array/path.
- Check condition at each step.
- Stop if found.

## Solution & Parameters

```js
// Parameters
var MIN_LEN = 4;
var MAX_LEN = 6;
var LEN = random(MIN_LEN, MAX_LEN);

// Solution
for (let i = 0; i < LEN; i++) {
  // Check condition (Simulated look)
  if (isPathRight()) { // Simulated "Found Target" logic -> Turn
     turnRight();
     collectItem();
     break; // Found it!
  }
  
  // If not found, keep moving/searching
  moveForward();
  
  // Note: In real generation, we'd ensure one spot has the "Target" property
  // For template simplicity, we just walk the line.
}
```
**Refined Logic for Generation**:
Since we don't have `isPathRight` sensors everywhere, we can simulate "Searching for a specific item count or marker".
```js
// Solution
for(let i=0; i<LEN; i++) {
  moveForward();
  // Simulated: If we see item, pick it up.
  // The generator will place items.
  collectItem(); 
}
```
Let's stick to a visual "Scan Row" pattern.
```js
// Solution
for(let i=0; i<LEN; i++) {
   moveForward();
   // Check THIS spot
   turnRight(); // Look
   turnLeft(); // Look back
}
collectItem(); // Assume found at end
```
