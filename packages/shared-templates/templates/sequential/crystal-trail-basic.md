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

## Features

- **Straight Path**: `_TURN_STYLE_ = 'straight'` ensures a single line
- **No Joining Items**: `_NO_ITEM_AT_ = 'noItemStart'` prevents items at start position
- **Safe Traversal**: `_HAS_JUMP_ = 'noJump'` keeps it simple for beginners

## Solution & Parameters

```js
// Parameters
var _MIN_STEPS_ = 3;
var _MAX_STEPS_ = 8;
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key
var _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight
var _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid
var _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump
var _NO_ITEM_AT_ = 'noItemStart'; // OPTIONS: noItemStart, noItemEnd, noItemBoth
var LEN = random(_MIN_STEPS_, _MAX_STEPS_);
var _SEED_ = random(1, 99999);

// Solution
randomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);
moveForward();
```
