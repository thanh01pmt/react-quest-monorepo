---
id: crystal-trail-straight-jump
name: "Crystal Trail: Jumps"
category: sequential
concepts: ["sequential", "jumps"]
difficulty: 2
tags: ["moveForward", "jump", "collectItem", "basic"]
author: system
version: 1
description: "Collect crystals along a straight path using jumps"
---

# Crystal Trail: Jumps

A straight path that introduces obstacles requiring the jump command.

## Learning Goals
- Practice `jump()` command
- Combine movement with jumping
- Maintain sequential logic

## Features

- **Straight Path**: `_TURN_STYLE_ = 'straight'` keeps the direction constant
- **Jumps Required**: `_HAS_JUMP_ = 'withJump'` introduces gaps/obstacles
- **Sequential**: Linear progression without complex turning

## Solution & Parameters

```js
// Parameters
var _MIN_STEPS_ = 3;
var _MAX_STEPS_ = 5;
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null
var _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null
var _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null
var _HAS_JUMP_ = 'withJump'; // OPTIONS: random, withJump, noJump, null
var _NO_ITEM_AT_ = 'noItemBoth'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null
var LEN = random(_MIN_STEPS_, _MAX_STEPS_);

// Solution
for (let i = 0; i < random(3, 5); i++) {
    randomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, random(1, 99999));
}
```
