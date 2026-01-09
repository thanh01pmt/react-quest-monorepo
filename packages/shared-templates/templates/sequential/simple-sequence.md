---
id: simple-sequence
name: "Simple Sequence"
category: sequential
concepts: ["sequential"]
difficulty: 1
tags: ["moveForward", "collectItem", "basic", "sequence"]
author: system
version: 1
description: "Sequential commands without loops - basic movement and collection"
---

# Simple Sequence

Learn the basics of sequential programming by executing commands in order.

## Learning Goals
- Understand sequential execution
- Practice basic commands
- Learn that each command runs one after another

## Solution & Parameters

```js
// Parameters
var _MIN_STEPS_ = 3;
var _MAX_STEPS_ = 6;
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key
var _STYLE_ = 'mixed'; // OPTIONS: mixed, straight, jump, turn
var _NET_TURN_ = 0; // OPTIONS: 0, 90, -90, 180
var LEN = random(_MIN_STEPS_, _MAX_STEPS_);

// Solution
// Generate a dynamic path using Micro Patterns
// This will create a random sequence of moves, turns, and collections.
// Users can adjust:
// - _INTERACTION_: item type
// - _STYLE_: movement style
// - _NET_TURN_: final direction change (0 same, 90 right, -90 left, 180 u-turn)
randomPattern(LEN, _INTERACTION_, _STYLE_, _NET_TURN_);
```

