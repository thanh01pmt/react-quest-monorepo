/**
 * Test Case: 10 - Complex Spiral
 * Difficulty: ⭐⭐⭐⭐⭐ (Expert)
 * Concept: Advanced pattern with nested loops and functions
 */

export default {
  id: '10-complex-spiral',
  name: 'Complex Spiral',
  difficulty: 5,
  concept: 'nested_loop',
  description: 'Create a spiral pattern using nested loops',
  code: `
    // Spiral pattern - decreasing lengths
    // Length pattern: 5, 5, 4, 4, 3, 3, 2, 2, 1, 1
    
    function collectAndMove() {
      moveForward();
      pickCrystal();
    }
    
    // First arm (5 steps)
    for (let i = 0; i < 5; i++) { collectAndMove(); }
    turnRight();
    for (let i = 0; i < 5; i++) { collectAndMove(); }
    turnRight();
    
    // Second arm (4 steps)
    for (let i = 0; i < 4; i++) { collectAndMove(); }
    turnRight();
    for (let i = 0; i < 4; i++) { collectAndMove(); }
    turnRight();
    
    // Third arm (3 steps)
    for (let i = 0; i < 3; i++) { collectAndMove(); }
    turnRight();
    for (let i = 0; i < 3; i++) { collectAndMove(); }
  `
};
