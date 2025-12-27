/**
 * Test Case: 04 - Square Pattern
 * Difficulty: ⭐⭐⭐ (Medium)
 * Concept: repeat_n - recognizing patterns
 */

export default {
  id: '04-square-pattern',
  name: 'Square Pattern',
  difficulty: 3,
  concept: 'repeat_n',
  description: 'Create a square pattern by repeating move-turn sequence',
  code: `
    // Draw a square - repeat 4 times
    for (let side = 0; side < 4; side++) {
      moveForward();
      pickCrystal();
      moveForward();
      pickCrystal();
      turnRight();
    }
  `
};
