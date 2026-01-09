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

## Features

- **Random Generation**: All parameters are adjustable for maximum variety
- **Dynamic Challenges**: Can include jumps, turns, and various items
- **Flexible Difficulty**: Adjust `_HAS_JUMP_` and `_TURN_STYLE_` to change complexity

## Solution & Parameters

```js
// Parameters
var _MIN_STEPS_ = 3;
var _MAX_STEPS_ = 6;
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key
var _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight
var _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid
var _HAS_JUMP_ = 'random'; // OPTIONS: random, withJump, noJump
var _NO_ITEM_AT_ = 'random'; // OPTIONS: random, noItemStart, noItemEnd, noItemBoth
var LEN = random(_MIN_STEPS_, _MAX_STEPS_);
var _SEED_ = random(1, 99999);

// Solution
// Generate a dynamic path using Micro Patterns
// This will create a random sequence of moves, turns, and collections.
// Users can adjust all parameters to customize the sequence
randomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);
moveForward();
```
