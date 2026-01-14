/**
 * Junior Theme for Horizontal Blocks
 * 
 * A simplified, kid-friendly theme with Google Doodle-inspired colors.
 */

import * as Blockly from 'blockly/core';

/**
 * Create the Junior theme for horizontal blocks
 */
export const juniorTheme = Blockly.Theme.defineTheme('junior', {
  name: 'junior',
  base: Blockly.Themes.Zelos, // Use Zelos as base for rounded shapes
  
  categoryStyles: {
    'events_category': {
      colour: '#14A795',
    },
    'movement_category': {
      colour: '#A4DD4A',
    },
    'turn_category': {
      colour: '#26A2F6',
    },
    'loops_category': {
      colour: '#F7941D',
    },
    'control_category': {
      colour: '#F7941D',
    },
  },
  
  blockStyles: {
    // Start block (hat/event)
    'events_category': {
      colourPrimary: '#14A795',
      colourSecondary: '#108677',
      colourTertiary: '#338c7b',
      hat: 'cap',
    },
    // Movement blocks
    'movement_category': {
      colourPrimary: '#A4DD4A',
      colourSecondary: '#54b947',
      colourTertiary: '#009444',
    },
    // Turn blocks  
    'turn_category': {
      colourPrimary: '#26A2F6',
      colourSecondary: '#0e79b2',
      colourTertiary: '#007ec4',
    },
    // Loop/control blocks
    'loops_category': {
      colourPrimary: '#F7941D',
      colourSecondary: '#c56101',
      colourTertiary: '#c16500',
    },
    'control_category': {
      colourPrimary: '#F7941D',
      colourSecondary: '#c56101',
      colourTertiary: '#c16500',
    },
    // Looks blocks (Say)
    'looks_category': {
      colourPrimary: '#9966FF',
      colourSecondary: '#774DCB',
      colourTertiary: '#5530A0',
    },
    // Action blocks (Collect, Toggle) - Red/Orange
    'actions_category': {
      colourPrimary: '#FF6680',
      colourSecondary: '#CD3352',
      colourTertiary: '#A61A3C',
    },
  },
  
  componentStyles: {
    'workspaceBackgroundColour': '#72D4C8',
    'toolboxBackgroundColour': '#5BBFB3',
    'flyoutBackgroundColour': '#5BBFB340',
    'flyoutOpacity': 0.9,
    'scrollbarColour': '#ffffff80',
    'insertionMarkerColour': '#FFFFFF',
    'insertionMarkerOpacity': 0.5,
    'cursorColour': '#FFFFFF',
  },
  
  fontStyle: {
    family: 'sans-serif',
    weight: 'bold',
    size: 14,
  },
  
  startHats: true,
});

export default juniorTheme;
