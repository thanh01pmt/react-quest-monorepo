// packages/quest-player/src/components/SettingsPanel/index.tsx

import React from 'react';
import { useTranslation } from 'react-i18next';
import './SettingsPanel.css';
import type { QuestPlayerSettings } from '../../types';
import { TOOLBOX_PRESET_LABELS, type ToolboxPresetKey } from '../../config/toolboxPresets';

type Renderer = NonNullable<QuestPlayerSettings['renderer']>;
type BlocklyThemeName = NonNullable<QuestPlayerSettings['blocklyThemeName']>;
type ColorSchemeMode = NonNullable<QuestPlayerSettings['colorSchemeMode']>;
type EnvironmentMode = 'day' | 'night';
type BlockMode = NonNullable<QuestPlayerSettings['blockMode']>;

// Preset keys available in Settings dropdown
const PRESET_OPTIONS: Array<'default' | ToolboxPresetKey> = [
  'default',
  'basic_movement',
  'with_actions',
  'with_loops',
  'with_functions',
  'with_conditionals',
  'full',
];

interface SettingsPanelProps {
  isOpen: boolean;

  // Các giá trị hiện tại
  renderer: Renderer;
  blocklyThemeName: BlocklyThemeName;
  gridEnabled: boolean;
  soundsEnabled: boolean;
  colorSchemeMode: ColorSchemeMode;
  toolboxPresetKey: 'default' | ToolboxPresetKey;
  environment: EnvironmentMode;
  blockMode?: BlockMode;

  // Các hàm callback để thay đổi giá trị
  onRendererChange: (renderer: Renderer) => void;
  onBlocklyThemeNameChange: (theme: BlocklyThemeName) => void;
  onGridChange: (enabled: boolean) => void;
  onSoundsChange: (enabled: boolean) => void;
  onColorSchemeChange: (mode: ColorSchemeMode) => void;
  onToolboxPresetChange: (preset: 'default' | ToolboxPresetKey) => void;
  onEnvironmentChange: (mode: EnvironmentMode) => void;
  onBlockModeChange?: (mode: BlockMode) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  renderer,
  blocklyThemeName,
  gridEnabled,
  soundsEnabled,
  colorSchemeMode,
  toolboxPresetKey,
  onRendererChange,
  onBlocklyThemeNameChange,
  onGridChange,
  onSoundsChange,
  onColorSchemeChange,
  onToolboxPresetChange,
  environment,
  onEnvironmentChange,
  blockMode = 'vertical',
  onBlockModeChange
}) => {
  const { t } = useTranslation();

  return (
    <div className={`settings-panel-container ${isOpen ? 'open' : ''}`}>
      <div className="settings-panel">
        <h3>{t('Settings.title')}</h3>

        {/* Block Mode Toggle - NEW */}
        {onBlockModeChange && (
          <div className="setting-item setting-item-highlight">
            <label htmlFor="blockmode-select">{t('Settings.blockMode', 'Block Layout')}</label>
            <select
              id="blockmode-select"
              value={blockMode}
              onChange={(e) => onBlockModeChange(e.target.value as BlockMode)}
            >
              <option value="vertical">{t('Settings.blockModeVertical', '📐 Vertical')}</option>
              <option value="horizontal">{t('Settings.blockModeHorizontal', '🐰 Junior (Horizontal)')}</option>
            </select>
          </div>
        )}

        <div className="setting-item">
          <label htmlFor="renderer-select">{t('Settings.renderer')}</label>
          <select
            id="renderer-select"
            value={renderer}
            onChange={(e) => onRendererChange(e.target.value as Renderer)}>
            <option value="zelos">Zelos</option>
            <option value="geras">Geras</option>
          </select>
        </div>
        <div className="setting-item">
          <label htmlFor="theme-select">{t('Settings.theme')}</label>
          <select
            id="theme-select"
            value={blocklyThemeName}
            onChange={(e) => onBlocklyThemeNameChange(e.target.value as BlocklyThemeName)}
          >
            <option value="zelos">Zelos</option>
            <option value="classic">Classic</option>
          </select>
        </div>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={gridEnabled}
              onChange={(e) => onGridChange(e.target.checked)}
            /> {t('Settings.grid')}
          </label>
        </div>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={soundsEnabled}
              onChange={(e) => onSoundsChange(e.target.checked)}
            /> {t('Settings.sounds')}
          </label>
        </div>
        <div className="setting-item">
          <label htmlFor="colorscheme-select">{t('Settings.colorScheme')}</label>
          <select
            id="colorscheme-select"
            value={colorSchemeMode}
            onChange={(e) => {
              const mode = e.target.value as ColorSchemeMode;
              onColorSchemeChange(mode);
              if (mode === 'light') {
                onEnvironmentChange('day');
              } else if (mode === 'dark') {
                onEnvironmentChange('night');
              } else if (mode === 'auto') {
                const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                onEnvironmentChange(isSystemDark ? 'night' : 'day');
              }
            }}
          >
            <option value="auto">{t('Settings.colorSchemeAuto')}</option>
            <option value="light">{t('Settings.colorSchemeLight')}</option>
            <option value="dark">{t('Settings.colorSchemeDark')}</option>
          </select>
        </div>
        <div className="setting-item">
          <label htmlFor="toolbox-preset-select">{t('Settings.toolbox')}</label>
          <select
            id="toolbox-preset-select"
            value={toolboxPresetKey}
            onChange={(e) => onToolboxPresetChange(e.target.value as 'default' | ToolboxPresetKey)}
          >
            {PRESET_OPTIONS.map((key) => (
              <option key={key} value={key}>
                {key === 'default' ? 'Default (Quest)' : TOOLBOX_PRESET_LABELS[key as ToolboxPresetKey]}
              </option>
            ))}
          </select>
        </div>
        <div className="setting-item">
          <label htmlFor="environment-select">{t('Settings.environment')}</label>
          <select
            id="environment-select"
            value={environment}
            onChange={(e) => onEnvironmentChange(e.target.value as EnvironmentMode)}
          >
            <option value="night">{t('Settings.environmentNight')}</option>
            <option value="day">{t('Settings.environmentDay')}</option>
          </select>
        </div>
      </div>
    </div>
  );
};