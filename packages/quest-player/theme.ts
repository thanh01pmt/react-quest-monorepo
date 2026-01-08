// packages/quest-player/src/games/maze/theme.ts

import * as Blockly from 'blockly/core';

export const mazeTheme = Blockly.Theme.defineTheme('maze', {
  name: 'maze', // <-- Thêm thuộc tính 'name' này
  base: Blockly.Themes.Zelos, // Use Zelos base to match Editor/Scratch style
  categoryStyles: {
    // Tên ở đây PHẢI KHỚP với thuộc tính "style" trong blocks.ts
    'events_category': {
      colour: '#FFBF00',
    },
    'movement_category': {
      colour: '#CF63CF',
    },
    'actions_category': {
      colour: '#A5745B',
    },
    'loops_category': {
      colour: '#5BA55B',
    },
    'logic_category': {
      colour: '#5B80A5',
    },
    'variables_category': {
      colour: '#FF8C1A',
    },
    'functions_category': {
      colour: '#995BA5',
    },
    'oop_category': {
      colour: '#9370DB',
    },
  },
  blockStyles: {
    // Block Styles matching Category Colors
    'events_category': {
      colourPrimary: '#FFBF00',
      colourSecondary: '#E6AC00',
      colourTertiary: '#CC9900',
      hat: 'cap', // Start block hat shape
    },
    'movement_category': {
      colourPrimary: '#CF63CF',
      colourSecondary: '#BA59BA',
      colourTertiary: '#A64FA6',
    },
    'actions_category': {
      colourPrimary: '#A5745B',
      colourSecondary: '#946852',
      colourTertiary: '#845D49',
    },
    'loops_category': {
      colourPrimary: '#5BA55B',
      colourSecondary: '#529452',
      colourTertiary: '#498449',
    },
    'logic_category': {
      colourPrimary: '#5B80A5',
      colourSecondary: '#527394',
      colourTertiary: '#496684',
    },
    'variables_category': {
      colourPrimary: '#FF8C1A',
      colourSecondary: '#DD7816',
      colourTertiary: '#BB6613',
    },
    'functions_category': {
      colourPrimary: '#995BA5',
      colourSecondary: '#804C8C',
      colourTertiary: '#693E73',
    },
    'oop_category': {
      colourPrimary: '#9370DB', 
      colourSecondary: '#8465C5',
      colourTertiary: '#7659AF',
    },
    'math_blocks': {
      colourPrimary: '#5b67a5',
      colourSecondary: '#4a548a',
      colourTertiary: '#3c4470',
    }
  },
  fontStyle: {
    family: 'sans-serif',
    weight: 'bold',
    size: 12,
  },
});