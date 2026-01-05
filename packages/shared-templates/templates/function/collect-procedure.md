---
id: collect-procedure
name: "Collect Procedure"
category: function
concepts: ["procedure_simple"]
difficulty: 4
tags: ["procedure", "function", "reuse"]
author: system
version: 1
description: "Create and use a procedure for collecting items"
---

# Collect Procedure

Create a reusable procedure for the collect-and-move pattern.

## Learning Goals
- Define custom procedures
- Call procedures to reduce code
- Understand code reuse

## Parameters

```js
var _COLLECTION_COUNT_ = 4;
```

## Solution Code

```js
function collectAndMove() {
  collectItem();
  moveForward();
}

// Use the procedure
for (let i = 0; i < _COLLECTION_COUNT_; i++) {
  collectAndMove();
}
