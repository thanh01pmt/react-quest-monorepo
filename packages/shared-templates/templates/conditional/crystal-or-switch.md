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
var _PATH_LENGTH_ = random(_MIN_PATH_LENGTH_, _MAX_PATH_LENGTH_);

// Solution
for (let i = 0; i < _PATH_LENGTH_; i++) {
  if (isOnCrystal()) {
    collectItem();
  } else if (isOnSwitch()) {
    toggleSwitch();
  }
  moveForward();
}
```
