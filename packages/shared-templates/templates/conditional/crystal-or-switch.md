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

## Parameters

```js
var _PATH_LENGTH_ = 5;
```

## Solution Code

```js
for (let i = 0; i < _PATH_LENGTH_; i++) {
  if (isOnCrystal()) {
    collectItem();
  } else if (isOnSwitch()) {
    toggleSwitch();
  }
  moveForward();
}
