/**
 * Test Case: 07 - Function with Loop
 * Difficulty: ⭐⭐⭐⭐ (Hard)
 * Concept: loop_function_call - combining functions and loops
 */

export default {
  id: '07-function-with-loop',
  name: 'Function with Loop',
  difficulty: 4,
  concept: 'loop_function_call',
  description: 'Call a function inside a loop to create complex patterns',
  code: `
    // Define a helper function
    function collectLine() {
      moveForward();
      pickCrystal();
      moveForward();
      pickCrystal();
      moveForward();
      pickCrystal();
    }
    
    // Use function in a loop to create zigzag
    for (let i = 0; i < 4; i++) {
      collectLine();
      turnRight();
    }
  `
};
