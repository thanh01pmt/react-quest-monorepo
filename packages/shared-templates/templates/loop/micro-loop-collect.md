---
id: micro-loop-collect
name: "Micro Loop Collect"
category: loop
concepts: ["loop", "repeat", "spacing"]
difficulty: 3
tags: ["loop", "crystal", "repeat"]
author: system
version: 4
description: "Use a loop to collect crystals with turns and spacing"
---

# Micro Loop Collect

A loop-based pattern that collects crystals, turns, and repeats.

## Features
- **Repetitive Collection**: Basic loop pattern for collecting items spaced out.
- **Spacing**: Uses `randomPattern` to generate variable spacing between items.

## Solution & Parameters

```js
// Parameters
var _MIN_REPEATS_ = 2;
var _MAX_REPEATS_ = 4;
var REPEATS = random(_MIN_REPEATS_, _MAX_REPEATS_);

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal'; // The item to collect
var _TURN_STYLE_ = 'straight';
var _TURN_POINT_ = 'null';
var _HAS_JUMP_ = 'noJump'; 
var _NO_ITEM_AT_ = 'random';
var _SEED_ = random(1, 99999);

// Solution
for (let i = 0; i < REPEATS; i++) {
  // Generate a segment that includes collection
  // nestedLoopCompatible=true is important here
  randomPattern(random(3, 5), _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);
  
  // Optional small turn to make it a loop/path not just a line
  if (random(0, 100) > 50) turnRight(); else turnLeft();
}
```
