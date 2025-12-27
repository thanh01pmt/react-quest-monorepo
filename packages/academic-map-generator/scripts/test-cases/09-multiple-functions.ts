/**
 * Test Case: 09 - Multiple Functions
 * Difficulty: ⭐⭐⭐⭐⭐ (Expert)
 * Concept: procedure_compose - multiple function definitions
 */

export default {
  id: '09-multiple-functions',
  name: 'Multiple Functions',
  difficulty: 5,
  concept: 'procedure_compose',
  description: 'Define and use multiple functions together',
  code: `
    // Helper function to move and collect
    function step() {
      moveForward();
      pickCrystal();
    }
    
    // Function to do a row
    function doRow() {
      step();
      step();
      step();
    }
    
    // Function to turn to next row
    function nextRow() {
      turnRight();
      moveForward();
      turnRight();
    }
    
    // Main logic
    doRow();
    nextRow();
    doRow();
    nextRow();
    doRow();
  `
};
