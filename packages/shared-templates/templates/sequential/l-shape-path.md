---
id: l-shape-path
name: "L-Shape Path"
category: sequential
concepts: ["sequential"]
difficulty: 2
tags: ["moveForward", "turn", "collectItem"]
author: system
version: 2
description: "Two identical straight segments with a right turn between them"
---

# L-Shape Path

Two identical straight segments connected by a right turn. Demonstrates pattern repetition using seed.

## Solution & Parameters

```js
// Parameters
var _MIN_STEPS_ = 6;
var _MAX_STEPS_ = 8;
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key
var _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, random
var _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random
var _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump
var _NO_ITEM_AT_ = 'noItemBoth'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth
var LEN = random(_MIN_STEPS_, _MAX_STEPS_);
var _SEED_ = random(1, 99999);

// Solution
// Segment 1
randomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);
moveForward();
turnRight();
// Segment 2 - identical to Segment 1 (same seed)
randomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);
```

## Features

- **Identical segments**: Same `_SEED_` ensures both segments have the same pattern
- **No items at boundaries**: `noItemBoth` prevents item collisions at junction
- **Straight movement**: `_TURN_STYLE_ = 'straight'` ensures no turns within segments
- **No jumping**: `_HAS_JUMP_ = 'noJump'` keeps path flat
