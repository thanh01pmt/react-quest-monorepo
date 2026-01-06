---
id: l-shape-path
name: "L-Shape Path"
category: sequential
concepts: ["sequential"]
difficulty: 2
tags: ["moveForward", "turn", "collectItem"]
author: system
version: 1
description: "Follow an L-shaped path collecting crystals"
---

# L-Shape Path

Navigate a path with a single turn.

## Solution & Parameters

```js
// Parameters
var MIN_LEG1 = 2;
var MAX_LEG1 = 5;
var LEG1 = random(MIN_LEG1, MAX_LEG1);

var MIN_LEG2 = 2;
var MAX_LEG2 = 5;
var LEG2 = random(MIN_LEG2, MAX_LEG2);

// Solution
moveForward();

for (let i = 0; i < LEG1; i++) {
  moveForward();
  collectItem();
}
turnRight();
for (let i = 0; i < LEG2; i++) {
  moveForward();
  collectItem();
}

moveForward();
```
