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
var _MIN_LEG1_ = 2;
var _MAX_LEG1_ = 5;
var LEG1 = random(_MIN_LEG1_, _MAX_LEG1_);

var _MIN_LEG2_ = 2;
var _MAX_LEG2_ = 5;
var LEG2 = random(_MIN_LEG2_, _MAX_LEG2_);

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
