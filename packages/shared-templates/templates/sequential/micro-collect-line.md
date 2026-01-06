---
id: micro-collect-line
name: "Micro Collect Line"
category: sequential
concepts: ["micropattern", "spacing", "collect"]
difficulty: 2
tags: ["sequential", "crystal", "spacing"]
author: system
version: 3
description: "Collect crystals along a line with configurable spacing"
---

# Micro Collect Line

A simple linear path collecting crystals with random spacing between them.

## Solution & Parameters

```js
var _MIN_CRYSTALS_ = 3;
var _MAX_CRYSTALS_ = 5;
var _MIN_SPACE_ = 0;
var _MAX_SPACE_ = 2;

var CRYSTALS = random(_MIN_CRYSTALS_, _MAX_CRYSTALS_);
var SPACE = random(_MIN_SPACE_, _MAX_SPACE_);

moveForward();

for (let i = 0; i < CRYSTALS; i++) {
  for (let s = 0; s < SPACE + 1; s++) {
    moveForward();
  }
  collectItem();
}

moveForward();
```
