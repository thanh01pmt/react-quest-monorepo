---
id: crystal-trail-full
name: "Crystal Trail: Master"
category: sequential
concepts: ["sequential", "turns", "jumps"]
difficulty: 3
tags: ["moveForward", "turn", "jump", "collectItem", "mixed"]
author: system
version: 1
description: "Complex path combining turns and jumps"
---

# Crystal Trail: Master

The ultimate sequential challenge combining turns and jumps on a long path.

## Learning Goals
- Integrate all movement commands
- Solve complex pathfinding problems
- Handle mixed obstacle types

## Features

- **Complex Path**: `_TURN_STYLE_ = 'randomLeftRight'` mixed with `_HAS_JUMP_ = 'withJump'`
- **Full Randomized**: Uses random seed for endless variations
- **Extended Length**: Composes multiple patterns for a longer quest

## Solution & Parameters

```js
// Parameters
var _MIN_STEPS_ = 4;
var _MAX_STEPS_ = 6;
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null
var _TURN_STYLE_ = 'random'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null
var _TURN_POINT_ = 'random'; // OPTIONS: null, start, end, mid, random
var _HAS_JUMP_ = 'random'; // OPTIONS: random, withJump, noJump, null
var _NO_ITEM_AT_ = 'noItemBoth'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth
var LEN = random(_MIN_STEPS_, _MAX_STEPS_);

// Solution
for (let i = 0; i < random(3, 5); i++) {
    randomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, random(1, 99999));
}
```
