---
id: crystal-trail-basic
name: "Crystal Trail"
category: sequential
concepts: ["sequential"]
difficulty: 1
tags: ["moveForward", "collectItem", "basic"]
author: system
version: 1
description: "Collect crystals along a straight path"
---

# Crystal Trail

A simple path with crystals to collect. Perfect for learning basic movement commands.

## Learning Goals
- Understand sequential execution
- Practice `moveForward()` command
- Learn `collectItem()` command

## Solution & Parameters

```js
// Parameters
var _MIN_CRYSTAL_COUNT_ = 3;
var _MAX_CRYSTAL_COUNT_ = 8;
var _CRYSTAL_COUNT_ = random(_MIN_CRYSTAL_COUNT_, _MAX_CRYSTAL_COUNT_);

// Solution
// Collect all crystals along the path
for (let i = 0; i < _CRYSTAL_COUNT_; i++) {
  moveForward();
  collectItem();
}
```
