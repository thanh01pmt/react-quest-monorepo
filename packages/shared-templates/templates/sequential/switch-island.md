---
id: switch-island
name: "Switch Islands"
category: sequential
concepts: ["sequential", "toggleSwitch", "exploration"]
difficulty: 3
tags: ["moveForward", "toggleSwitch", "jump"]
author: system
version: 1
description: "Navigate to switch islands branching off the main path"
---

# Switch Islands

A path with switches that extend into small island areas for exploration.

## Learning Goals
- Understanding branching paths
- Toggle switches at specific locations
- Spatial reasoning with side paths

## Features

- **Extended Areas**: `extendShape` creates exploration zones at switch locations
- **Main + Side Paths**: Players follow main path and detour to islands
- **3D Compatible**: Works with flat and elevated maps

## Solution & Parameters

```js
// Parameters
var _MIN_STEPS_ = 4;
var _MAX_STEPS_ = 6;
var _INTERACTION_ = 'switch'; // OPTIONS: crystal, switch, key, mixed, null
var _TURN_STYLE_ = 'randomLeftRight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null
var _TURN_POINT_ = 'end'; // OPTIONS: null, start, end, mid, random
var _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null
var _NO_ITEM_AT_ = 'noItemBoth'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth
var LEN = random(_MIN_STEPS_, _MAX_STEPS_);

// Solution: Create a path with switches
for (let i = 0; i < random(2, 4); i++) {
    randomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, random(1, 99999));
}

// Post-Process Parameters
var _PP_SHAPE_ = 'square'; // OPTIONS: square, mountain, circle
var _PP_SIZE_MIN_ = 2; // OPTIONS: 2, 3, 4, 5
var _PP_SIZE_MAX_ = 3; // OPTIONS: 2, 3, 4, 5
var _PP_BIAS_ = 'left'; // OPTIONS: center, left, right
var _PP_MATERIAL_ = 'grass'; // OPTIONS: grass, stone, water, ice

// Post-process: Extend square islands at each switch position
postProcess({ 
    type: 'extendShape', 
    shape: _PP_SHAPE_, 
    size: [_PP_SIZE_MIN_, _PP_SIZE_MAX_], 
    bias: _PP_BIAS_,
    levelMode: 'same',
    material: _PP_MATERIAL_,
    connectPath: true
});
```
