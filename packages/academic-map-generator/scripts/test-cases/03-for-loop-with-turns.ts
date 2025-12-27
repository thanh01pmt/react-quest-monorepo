/**
 * Test Case: 03 - FOR Loop with Turns
 * Difficulty: ⭐⭐ (Easy)
 * Concept: repeat_n with direction changes
 */

export default {
  id: '03-for-loop-with-turns',
  name: 'FOR Loop with Turns',
  difficulty: 2,
  concept: 'repeat_n',
  description: 'Collect crystals while turning to create an L-shape',
  code: `
    // Move forward and turn to create L-shape
    for (let i = 0; i < 3; i++) {
      moveForward();
      pickCrystal();
    }
    turnRight();
    for (let i = 0; i < 3; i++) {
      moveForward();
      pickCrystal();
    }
  `
};
