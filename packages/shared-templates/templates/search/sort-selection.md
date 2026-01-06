---
id: sort-selection
name: "Selection Sort Sim"
category: search
concepts: ["nested_loop", "search", "sorting"]
difficulty: 6
tags: ["sorting", "algorithm", "selection"]
author: system
version: 1
description: "Scan row, find item, bring it back. Repeat."
---

# Selection Sort Simulation

Simulates the mechanic of finding the "best" item and placing it.

## Academic Concept: Selection Sort ($O(N^2)$)
- Find min/max in unsorted part.
- Swap/Move to sorted part.

## Solution & Parameters

```js
// Parameters
var _MIN_ITEMS_ = 2;
var _MAX_ITEMS_ = 3;
var ITEMS = random(_MIN_ITEMS_, _MAX_ITEMS_);
var UNIVERSE_SIZE = 4;

// Solution
for (var i = 0; i < ITEMS; i++) {
  // 1. Search Phase (Go out)
  for(var k=0; k<UNIVERSE_SIZE; k++) {
     moveForward();
  }
  
  // 2. Action (Simulate "Select")
  collectItem();
  turnAround();
  
  // 3. Return Phase (Place)
  for(var k=0; k<UNIVERSE_SIZE; k++) {
     moveForward();
  }
  
  // 4. Next Iteration setup
  turnAround();
}
```
