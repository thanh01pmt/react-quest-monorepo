// packages/quest-player/src/index.ts

// Main component export
export { QuestPlayer } from './components/QuestPlayer';
export { questPlayerResources } from './i18n';
export type { QuestPlayerProps } from './components/QuestPlayer';

// Child components (for library mode usage in apps)
export { Dialog } from './components/Dialog';
export { QuestImporter } from './components/QuestImporter';
export { LanguageSelector } from './components/LanguageSelector';
export { GuideRenderer } from './components/GuideRenderer';
export { BlocklyRenderer } from './components/BlocklyRenderer';

// Type exports for consumers
export type {
  Quest,
  QuestPlayerSettings,
  QuestCompletionResult,
  QuestMetrics, // NEW: Export for analytics
  GameState,
  SolutionConfig,
  ToolboxJSON,
  ToolboxItem
} from './types';

// Toolbox exports
export { toolboxPresets, getToolboxPreset } from './config/toolboxPresets';
export type { ToolboxPresetKey } from './config/toolboxPresets';

// NEW: Export the schema for external validation
export { questSchema } from './types/schemas';
export { GameAssets } from './games/maze/config/gameAssets'; // Giữ lại export này

// SỬA LẠI: Export trực tiếp từ các file định nghĩa của game maze
export { init as initMazeBlocks } from './games/maze/blocks'; // <-- Đổi tên export ở đây
export { mazeTheme } from '../theme'; // Trỏ đến file theme ở gốc /packages/quest-player/theme.ts
export { createBlocklyTheme } from './components/QuestPlayer/utils';
