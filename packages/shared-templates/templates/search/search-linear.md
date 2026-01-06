---
id: search-linear
name: "Linear Search"
category: search
concepts: ["loop", "search"]
difficulty: 4
tags: ["search", "algorithm", "linear"]
author: system
version: 1
description: "Move along a line, checking each spot and collecting crystals"
---

# Linear Search

Classic search algorithm: check every item until you find what you need.

## Academic Concept: Linear Search ($O(N)$)
- Iterate through array/path.
- Check condition at each step.
- Collect if found.

## Solution & Parameters

```js
// Parameters
var _MIN_LEN_ = 4;
var _MAX_LEN_ = 6;
var LEN = random(_MIN_LEN_, _MAX_LEN_);

// Solution
// Walk the path and collect crystals along the way
for (let i = 0; i < LEN; i++) {
  moveForward();
  collectItem();
}
```
