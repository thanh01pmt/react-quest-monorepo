---
id: crystal-or-switch
name: "Crystal or Switch"
category: conditional
concepts: ["if_else"]
difficulty: 4
tags: ["if", "else", "detect"]
author: system
version: 2
description: "Decide whether to collect crystal or activate switch"
---

# Crystal or Switch

Learn to make decisions based on what's in front of you.

## Learning Goals
- Use if-else for decision making
- Detect items in the environment
- Choose correct action based on condition

## Features
- **Conditional Logic**: Requires checking `isItemPresent` to react correctly.
- **Random Environment**: Items are placed randomly, forcing the use of logic over rote memorization.

## Solution & Parameters

```js
// Parameters
var _MIN_PATH_LENGTH_ = 3;
var _MAX_PATH_LENGTH_ = 5;
var PATH_LENGTH = random(_MIN_PATH_LENGTH_, _MAX_PATH_LENGTH_);

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null
var _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null
var _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null
var _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null
var _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null
var _SEED_ = random(1, 99999);

// Solution
for (let i = 0; i < PATH_LENGTH; i++) {
  // Generate 1-step segments.
  // We want EITHER crystal OR switch (or nothing). 
  // randomPattern 'interactionType' is usually fixed per call.
  // To mix types, we might need a workaround or just rely on 'random' noItemAt
  // However, randomPattern currently generates ONE type of item if item is placed.
  // Strategy: Alternating calls or multiple random calls doesn't work well for "OR" logic in one spot easily without strict control.
  // BUT, let's use a trick: 
  // We can't easily swap interaction type per step in one loop purely with these params unless we have a 'mixed' type.
  // For now, let's assume we stick to one primary type for simplicity, or if the system supports 'mixed', we use that.
  // Checking docs: randomPattern takes 'interactionType'. 
  // workaround: Use a custom seed to decide what to call.
  
  if (random(0, 100) < 50) {
     randomPattern(1, 'crystal', true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);
  } else {
     randomPattern(1, 'switch', true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);
  }
}
```

