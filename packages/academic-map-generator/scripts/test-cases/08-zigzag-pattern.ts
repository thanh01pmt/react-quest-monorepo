/**
 * Test Case: 08 - Zigzag Pattern
 * Difficulty: ⭐⭐⭐⭐ (Hard)
 * Concept: nested_loop with alternating directions
 */

export default {
  id: '08-zigzag-pattern',
  name: 'Zigzag Pattern',
  difficulty: 4,
  concept: 'nested_loop',
  description: 'Create a zigzag pattern with alternating turns',
  code: `
    // Zigzag pattern - 3 rows, alternating direction
    for (let row = 0; row < 3; row++) {
      // Collect crystals in row
      for (let col = 0; col < 4; col++) {
        moveForward();
        pickCrystal();
      }
      // Turn to next row (alternates left/right)
      turnRight();
      moveForward();
      turnRight();
    }
  `
};
