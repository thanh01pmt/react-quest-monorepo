---
id: crystal-or-switch
name: "Crystal or Switch"
category: conditional
concepts: ["if_else"]
difficulty: 4
tags: ["if", "else", "detect"]
author: system
version: 1
description: "Decide whether to collect crystal or activate switch"
---

# Crystal or Switch

Learn to make decisions based on what's in front of you.

## Learning Goals
- Use if-else for decision making
- Detect items in the environment
- Choose correct action based on condition

## Solution & Parameters

```js
// Parameters
var _MIN_PATH_LENGTH_ = 3;
var _MAX_PATH_LENGTH_ = 6;
var PATH_LENGTH = random(_MIN_PATH_LENGTH_, _MAX_PATH_LENGTH_);

// Solution
moveForward();

for (let i = 0; i < PATH_LENGTH; i++) {
  if (isOnCrystal()) {
    collectItem();
  } else if (isOnSwitch()) {
    toggleSwitch();
  }
  moveForward();
}

moveForward();
```
