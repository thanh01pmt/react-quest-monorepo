// packages/quest-player/src/index.ts

// Main component export
export { QuestPlayer } from './components/QuestPlayer';
export type { QuestPlayerProps } from './components/QuestPlayer';
export * from './components/BlocklyRenderer';
export * from './components/GuideRenderer';

// Child components (for library mode usage in apps)
export { Dialog } from './components/Dialog';
export { QuestImporter } from './components/QuestImporter';
export { LanguageSelector } from './components/LanguageSelector';

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
