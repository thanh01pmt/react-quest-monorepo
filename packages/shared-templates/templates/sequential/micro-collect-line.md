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

## Features

- **Straight Line**: `_TURN_STYLE_ = 'straight'` ensures linear collection
- **Varied Spacing**: Random seed creates different collection intervals
- **Clean Start**: `_NO_ITEM_AT_ = 'noItemStart'` ensures first block is empty for player start

```js
// Parameters
var _MIN_STEPS_ = 3;
var _MAX_STEPS_ = 8;
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key
var _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, random
var _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random
var _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump
var _NO_ITEM_AT_ = 'noItemStart'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth
var LEN = random(_MIN_STEPS_, _MAX_STEPS_);
var _SEED_ = random(1, 99999);

// Solution
randomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);
moveForward();
```
