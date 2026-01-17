// packages/quest-player/src/index.ts

// Main component export
export { QuestPlayer } from './components/QuestPlayer';
export type { QuestPlayerProps } from './components/QuestPlayer';
export * from './components/BlocklyRenderer';
export * from './components/GuideRenderer';

// Horizontal/Junior Mode components
export { HorizontalBlocklyRenderer } from './components/HorizontalBlocklyRenderer';
export { juniorTheme } from './renderers/juniorTheme';
export { initJuniorBlocks, getJuniorToolbox } from './games/maze/juniorBlocks';
export { 
  registerHorizontalRenderer,
  HorizontalRenderer,
} from './renderers/HorizontalRenderer';

// Child components (for library mode usage in apps)
export { Dialog } from './components/Dialog';
export { QuestImporter } from './components/QuestImporter';
export { LanguageSelector } from './components/LanguageSelector';

// Re-export BlocklyWorkspace for solution display
export { BlocklyWorkspace } from 'react-blockly';

// Type exports for consumers
export type {
  Quest,
  QuestPlayerSettings,
  QuestCompletionResult,
  QuestMetrics, // NEW: Export for analytics
  GameState,
  SolutionConfig,
  // Game-specific types
  MazeConfig,
  Collectible,
  Interactive,
} from './types';

// NEW: Export the schema for external validation
export { questSchema } from './types/schemas';
export { GameAssets } from './games/maze/config/gameAssets'; // Giữ lại export này

// SỬA LẠI: Export trực tiếp từ các file định nghĩa của game maze
export { init as initMazeBlocks } from './games/maze/blocks'; // <-- Đổi tên export ở đây
export { mazeTheme } from '../theme'; // Trỏ đến file theme ở gốc /packages/quest-player/theme.ts

// Export Toolbox helpers
// Export Toolbox helpers
export { getToolboxPreset, getToolboxPresetWithFallback, toolboxPresets, type ToolboxPresetKey } from './config/toolboxPresets';

// Utils
export { createBlocklyTheme } from './components/QuestPlayer/utils';

// I18n Resources
export { questPlayerResources } from './i18n';
