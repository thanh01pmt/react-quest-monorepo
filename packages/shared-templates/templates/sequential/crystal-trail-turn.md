---
id: crystal-trail-turn
name: "Crystal Trail: Turns"
category: sequential
concepts: ["sequential", "turns"]
difficulty: 2
tags: ["moveForward", "turnLeft", "turnRight", "collectItem"]
author: system
version: 1
description: "Collect crystals on a winding path with turns"
---

# Crystal Trail: Turns

A winding path that requires the player to turn left and right to collect crystals.

## Learning Goals
- Practice `turnLeft()` and `turnRight()`
- Navigate changing directions
- Plan path ahead

## Features

- **Winding Path**: `_TURN_STYLE_ = 'randomLeftRight'` creates twists and turns
- **No Jumps**: `_HAS_JUMP_ = 'noJump'` focuses solely on turning logistics
- **Dynamic Turns**: `_TURN_POINT_ = 'random'` varies where turns occur

## Solution & Parameters

```js
// Parameters
// Parameters
var _MIN_STEPS_ = 4;
var _MAX_STEPS_ = 8;
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null
var _TURN_STYLE_ = 'randomLeftRight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null
var _TURN_POINT_ = 'end'; // OPTIONS: start, end, mid, random, null
var _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null
var _NO_ITEM_AT_ = 'noItemBoth'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null
var LEN = random(_MIN_STEPS_, _MAX_STEPS_);

// Solution
for (let i = 0; i < random(2, 4); i++) {
    randomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, random(1, 99999));
}
```
