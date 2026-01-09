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

```js
// Parameters
var _MIN_LEN_ = 3;
var _MAX_LEN_ = 8;
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key
var _TURN_STYLE_ = 'straight';
var _TURN_POINT_ = 'null';
var _HAS_JUMP_ = 'noJump'; // Line walk typically doesn't jump

var LEN = random(_MIN_LEN_, _MAX_LEN_);

// Solution
randomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_);
```
