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

## Parameters

```js
var _CRYSTAL_COUNT_ = 3;
```

## Solution Code

```js
// Collect all crystals along the path
for (let i = 0; i < _CRYSTAL_COUNT_; i++) {
  moveForward();
  collectItem();
}
```
