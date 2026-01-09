---
id: crystal-trail-basic
name: "Crystal Trail"
category: sequential
concepts: ["sequential"]
difficulty: 1
tags: ["moveForward", "collectItem", "basic"]
author: system
version: 1
description: "Collect crystals along a straight path"
---

# Crystal Trail

A simple path with crystals to collect. Perfect for learning basic movement commands.

## Learning Goals
- Understand sequential execution
- Practice `moveForward()` command
- Learn `collectItem()` command

## Solution & Parameters

```js
// Parameters
var _MIN_LEN_ = 3;
var _MAX_LEN_ = 8;
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key
// Straight line = no turns
var _TURN_STYLE_ = 'straight';
var _TURN_POINT_ = 'null';
var _HAS_JUMP_ = 'noJump'; // Default to no jump for basic trail

var LEN = random(_MIN_LEN_, _MAX_LEN_);

// Solution
randomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_);
```
