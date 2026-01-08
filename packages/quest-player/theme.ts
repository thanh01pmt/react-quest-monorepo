// packages/quest-player/src/games/maze/theme.ts

import * as Blockly from 'blockly';

export const mazeTheme = Blockly.Theme.defineTheme('maze', {
  name: 'maze',
  base: (Blockly.Themes as any).Zelos || Blockly.Themes.Classic,
  categoryStyles: {
    'events_category': { colour: '#FFBF00' },
    'movement_category': { colour: '#CF63CF' },
    'actions_category': { colour: '#A5745B' },
    'loops_category': { colour: '#5BA55B' },
    'logic_category': { colour: '#5B80A5' },
    'variables_category': { colour: '#FF8C1A' },
    'variable_category': { colour: '#FF8C1A' }, // Alias for toolbox
    'functions_category': { colour: '#995BA5' },
    'procedure_category': { colour: '#995BA5' }, // Alias for toolbox
    'math_blocks': { colour: '#5B67A5' },
    'math_category': { colour: '#5B67A5' }, // Alias for toolbox
    'list_category': { colour: '#745BA5' }, // New
    'text_category': { colour: '#5BA58C' }, // New
    'oop_category': { colour: '#9370DB' },
  },
  blockStyles: {
    'events_category': {
      colourPrimary: '#FFBF00',
      colourSecondary: '#FFBF00',
      colourTertiary: '#FFBF00',
      hat: 'cap',
    },
    'movement_category': {
      colourPrimary: '#CF63CF',
      colourSecondary: '#CF63CF',
      colourTertiary: '#CF63CF',
    },
    'actions_category': {
      colourPrimary: '#A5745B',
      colourSecondary: '#A5745B',
      colourTertiary: '#A5745B',
    },
    'loops_category': {
      colourPrimary: '#5BA55B',
      colourSecondary: '#5BA55B',
      colourTertiary: '#5BA55B',
    },
    'logic_category': {
      colourPrimary: '#5B80A5',
      colourSecondary: '#5B80A5',
      colourTertiary: '#5B80A5',
    },
    'variables_category': {
      colourPrimary: '#FF8C1A',
      colourSecondary: '#FF8C1A',
      colourTertiary: '#FF8C1A',
    },
    'variable_category': {
      colourPrimary: '#FF8C1A',
      colourSecondary: '#FF8C1A',
      colourTertiary: '#FF8C1A',
    },
    'functions_category': {
      colourPrimary: '#995BA5',
      colourSecondary: '#995BA5',
      colourTertiary: '#995BA5',
    },
    'procedure_category': {
      colourPrimary: '#995BA5',
      colourSecondary: '#995BA5',
      colourTertiary: '#995BA5',
    },
    'procedure_blocks': {
      colourPrimary: '#995BA5',
      colourSecondary: '#995BA5',
      colourTertiary: '#995BA5',
    },
    'math_blocks': {
      colourPrimary: '#5B67A5',
      colourSecondary: '#5B67A5',
      colourTertiary: '#5B67A5',
    },
    'logic_blocks': {
      colourPrimary: '#5B80A5',
      colourSecondary: '#5B80A5',
      colourTertiary: '#5B80A5',
    },
    'loop_blocks': {
      colourPrimary: '#5BA55B',
      colourSecondary: '#5BA55B',
      colourTertiary: '#5BA55B',
    },
    'list_blocks': {
      colourPrimary: '#745BA5',
      colourSecondary: '#745BA5',
      colourTertiary: '#745BA5',
    },
    'text_blocks': {
      colourPrimary: '#5BA58C',
      colourSecondary: '#5BA58C',
      colourTertiary: '#5BA58C',
    },
    'variable_blocks': {
      colourPrimary: '#FF8C1A',
      colourSecondary: '#FF8C1A',
      colourTertiary: '#FF8C1A',
    },
    'math_category': {
      colourPrimary: '#5B67A5',
      colourSecondary: '#5B67A5',
      colourTertiary: '#5B67A5',
    },
    'list_category': {
      colourPrimary: '#745BA5',
      colourSecondary: '#745BA5',
      colourTertiary: '#745BA5',
    },
    'text_category': {
      colourPrimary: '#5BA58C',
      colourSecondary: '#5BA58C',
      colourTertiary: '#5BA58C',
    },
    'oop_category': {
      colourPrimary: '#9370DB',
      colourSecondary: '#9370DB',
      colourTertiary: '#9370DB',
    },
  },
  fontStyle: {
    family: 'sans-serif',
    weight: 'bold',
    size: 12,
  },
});