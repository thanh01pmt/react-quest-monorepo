/**
 * Test Case: 06 - Nested FOR Loops
 * Difficulty: ⭐⭐⭐⭐ (Hard)
 * Concept: nested_loop - loops inside loops
 */

export default {
  id: '06-nested-for-loops',
  name: 'Nested FOR Loops',
  difficulty: 4,
  concept: 'nested_loop',
  description: 'Create a grid pattern using nested loops',
  code: `
    // Draw a 3x4 grid using nested loops
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        moveForward();
        pickCrystal();
      }
      // Move to next row
      turnRight();
      moveForward();
      turnRight();
    }
  `
};
