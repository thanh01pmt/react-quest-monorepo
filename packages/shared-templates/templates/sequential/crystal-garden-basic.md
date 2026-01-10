---
id: crystal-garden-basic
name: "Crystal Garden"
category: sequential
concepts: ["sequential", "optimization"]
difficulty: 2
tags: ["moveForward", "collectItem", "strategy"]
author: system
version: 1
description: "Collect crystals in an open garden - find the optimal path"
---

# Crystal Garden

An open-area map where players must strategize to collect all crystals efficiently.
Unlike trail maps, there are multiple valid paths.

## Learning Goals
- Strategic thinking - choosing optimal routes
- Understanding there can be multiple solutions
- Practicing movement commands in 2D space

## Features

- **Open Arena**: `fillBoundingBox` creates an open area around the path
- **Multiple Routes**: Players can choose different paths to collect items
- **Strategic Gameplay**: Encourages optimization thinking

## Solution & Parameters

```js
// Parameters
var _MIN_STEPS_ = 3;
var _MAX_STEPS_ = 4;
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null
var _TURN_STYLE_ = 'randomLeftRight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null
var _TURN_POINT_ = 'random'; // OPTIONS: null, start, end, mid, random
var _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null
var _NO_ITEM_AT_ = 'noItemBoth'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth
var LEN = random(_MIN_STEPS_, _MAX_STEPS_);

// Solution: Create a winding path with crystals
for (let i = 0; i < random(2, 3); i++) {
    randomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, random(1, 99999));
}

// Post-process: Fill the bounding box to create open area
postProcess({ type: 'fillBoundingBox', offset: 1, material: 'grass', walkable: true });
```
