/**
 * Test Case: 05 - Simple Function
 * Difficulty: ⭐⭐⭐ (Medium)
 * Concept: procedure_simple - function definition and call
 */

export default {
  id: '05-simple-function',
  name: 'Simple Function',
  difficulty: 3,
  concept: 'procedure_simple',
  description: 'Define a function and call it multiple times',
  code: `
    // Define a reusable function
    function collectTwo() {
      moveForward();
      pickCrystal();
      moveForward();
      pickCrystal();
    }
    
    // Call the function 3 times with turns
    collectTwo();
    turnRight();
    collectTwo();
    turnRight();
    collectTwo();
  `
};
