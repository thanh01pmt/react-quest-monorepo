/**
 * Test Case: 02 - Simple FOR Loop
 * Difficulty: ⭐⭐ (Easy)
 * Concept: repeat_n - counted loop
 */

export default {
  id: '02-simple-for-loop',
  name: 'Simple FOR Loop',
  difficulty: 2,
  concept: 'repeat_n',
  description: 'Use a for loop to collect 5 crystals',
  code: `
    // Collect 5 crystals using a loop
    for (let i = 0; i < 5; i++) {
      moveForward();
      pickCrystal();
    }
  `
};
