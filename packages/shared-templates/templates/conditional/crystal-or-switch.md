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
var MIN_PATH_LENGTH = 3;
var MAX_PATH_LENGTH = 6;
var PATH_LENGTH = random(MIN_PATH_LENGTH, MAX_PATH_LENGTH);

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
