# 100 Template Matrix: Academic Skeletons

To ensure **High Academic Quality**, we define map "Skeletons" based on algorithmic patterns. These are reusable logic structures. *Action Atoms* (Collect/Jump) are then plugged into these skeletons.

## 1. Academic Skeletons (The "Logic")

These are abstract patterns independent of the specific action.

### S1: Linear Arithmetic (Progression)
*Description*: Perform action N times, where N increases by a step.
*Logic*: `for i=1 to M: repeat(i*step) { action }`
*Academic Concept*: Arithmetic Progression, Variable Increment.

### S2: Geometric Spiral (Growth)
*Description*: Perform action N times, where N multiplies or grows non-linearly.
*Logic*: `len = 1; for i=1 to M: repeat(len) { action }; len *= 2; turn()`
*Academic Concept*: Geometric Progression, Exponential Growth.

### S3: Alternating Logic (Parity)
*Description*: Different actions for Odd vs Even steps.
*Logic*: `for i=1 to N: if (i%2==0) { Action A } else { Action B }`
*Academic Concept*: Modulo, Parity, State Oscillation.

### S4: Backtracking (Stack)
*Description*: Go forward performing A, turn around, return performing B.
*Logic*: `List L; for x in Path: do(A); push(x); ... turn(); while L: y=pop(); do(B)` (Simplified: Forward N, Back N)
*Academic Concept*: Inverse Operations, Stack/Memory.

### S5: State Machine (Sequence)
*Description*: Action depends on current "state" (e.g., color of floor).
*Logic*: `while path: switch(read_state()): case R: Action A; case B: Action B.`
*Academic Concept*: State Machines, Conditionals.

### S6: Divide & Conquer (Fractal/Nested)
*Description*: Break a large task (Square) into smaller identical tasks (Lines).
*Logic*: `Function Line() { ... }; Function Square() { repeat(4) Line(); turn(); }`
*Academic Concept*: Decomposition, Abstraction.

---

## 2. The Matrix (Skeleton x Atom)

We pair Skeletons with Atoms to generate UNIQUE templates.

### Category: "Progression" (Variable/Loop Focus)
1.  **Prog_Arith_Move**: Walk 1, then 2, then 3 steps. (`Skeleton S1` + `Atom Move`)
2.  **Prog_Arith_Collect**: Collect 1, then 2, then 3 items. (`Skeleton S1` + `Atom Collect`)
3.  **Prog_Geo_Spiral**: Spiral out (1, 2, 4, 8 steps). (`Skeleton S2` + `Atom Move`)
4.  **Prog_Fib_Path**: Walk Fibonacci/Golden Ratio path.
5.  **Prog_Decay**: Start with 5 actions, decrease to 1.

### Category: "Logic & Parity" (Conditional Focus)
6.  **Logic_Alt_Move**: Step-Jump-Step-Jump. (`Skeleton S3` + `Atoms Move/Jump`)
7.  **Logic_Alt_Interact**: Collect-Toggle-Collect-Toggle. (`Skeleton S3` + `Atoms Collect/Toggle`)
8.  **Logic_3_Way**: Modulo 3 (Step-Jump-Collect).
9.  **Logic_Checkerboard**: Interact only on "Black" cells (i+j is even).

### Category: "Memory & Inverse" (Function Focus)
10. **Mem_Return**: Walk path, Turn, Walk exact path back. (`Skeleton S4` + `Atom Move`)
11. **Mem_Undo**: Toggle switches ON, Turn, Toggle switches OFF. (`Skeleton S4` + `Atom Toggle`)
12. **Mem_Palindrome**: Path is symmetrical (Action sequence reads same forward/back).

### Category: "Decomposition" (Function Focus)
13. **Decomp_Square**: Draw Square using Line function.
14. **Decomp_Stair**: Build Stair using Step function.
15. **Decomp_Grid**: Harvest Grid using Row function.
16. **Decomp_Flower**: Draw Petal function -> Repeat 4 times.

### Category: "Search & Optimization" (Capstone)
17. **Search_Linear**: Scan row for finding item.
18. **Search_Binary**: (Simulated) Go to middle, check, go left/right.
19. **Sort_Selection**: (Simulated) Find max, collect, repeat.

---

## 3. Execution Plan
We will implement these Skeletons as reusable JS logic in the `SolutionDrivenGenerator`, then use the `.md` templates to invoke them with specific Atoms.

*Example Template MD*:
```js
// Skeleton: S1 (Arithmetic)
// Atom: Collect
var start = 1;
var step = random(1, 2);
for(var i=0; i<3; i++) {
   var count = start + i*step;
   repeat(count) { collect(); move(); } // Atom P2
}
```
This ensures high academic variance (the math/logic) while allowing infinite visual variance (the atoms).

## 4. Validation Strategy (Collision)

Since maps are generated from solution traces (Solution-Driven), variable parameters might cause paths to cross or revisit the same coordinate.

**Rule**: A generated map is **INVALID** if >1 item is placed on the same coordinate.
*   **Constraint**: `Map[x][y][z]` can hold max **1 Item**.
*   **Mechanism**:
    1.  Trace solution code (simulate execution).
    2.  Track `item_placements = Set<Coord>`.
    3.  If `new_item_coord` exists in `item_placements` -> **REJECT** (Retry with new random seed).
    4.  Only accept maps with **ZERO** item collisions.

This ensures that "Academic Skeletons" (which often involve backtracking or complex patterns) do not produce physically impossible maps.
