/**
 * BuilderModeContext
 * 
 * Provides centralized state management for the Map Builder's mode system.
 * Supports Manual (Build) and Auto (Generate) workflows within a unified interface.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * Builder mode types
 */
export type BuilderMode = 'manual' | 'auto';

/**
 * Configuration saved after generation for reference/regeneration
 */
export interface GenerateConfig {
    topology: string;
    params: Record<string, any>;
    strategy: string;
    difficulty: string;
    academicParams?: {
        bloomLevel?: number;
        coreSkills?: string[];
    };
    itemGoals?: {
        gems?: number;
        crystals?: number;
        switches?: number;
    };
}

/**
 * Complete builder state
 */
export interface BuilderState {
    /** Current mode: manual or auto */
    mode: BuilderMode;

    /** True when generate is in progress */
    isGenerating: boolean;

    /** True after generate completes (hybrid editing mode) */
    isEditing: boolean;

    /** Lock ground blocks from editing */
    isPathLocked: boolean;

    /** Configuration from last generate (for regeneration) */
    lastGenerateConfig: GenerateConfig | null;

    /** Active layer filter */
    activeLayer: 'all' | 'ground' | 'items';

    /** Smart snap enabled */
    smartSnapEnabled: boolean;
}

/**
 * Context value type
 */
interface BuilderModeContextValue {
    state: BuilderState;

    // Mode actions
    setMode: (mode: BuilderMode) => void;
    toggleMode: () => void;

    // Generation actions
    setIsGenerating: (value: boolean) => void;
    setIsEditing: (value: boolean) => void;
    setLastGenerateConfig: (config: GenerateConfig | null) => void;

    // Path lock actions
    setIsPathLocked: (value: boolean) => void;
    togglePathLock: () => void;

    // Layer actions
    setActiveLayer: (layer: 'all' | 'ground' | 'items') => void;

    // Smart snap actions
    setSmartSnapEnabled: (value: boolean) => void;
    toggleSmartSnap: () => void;

    // Reset
    resetToDefault: () => void;

    // Utility
    canEdit: (objectType: 'block' | 'collectible' | 'interactible' | 'player' | 'finish') => boolean;
}

const defaultState: BuilderState = {
    mode: 'manual',
    isGenerating: false,
    isEditing: false,
    isPathLocked: false,
    lastGenerateConfig: null,
    activeLayer: 'all',
    smartSnapEnabled: true,
};

const BuilderModeContext = createContext<BuilderModeContextValue | null>(null);

interface BuilderModeProviderProps {
    children: ReactNode;
    initialMode?: BuilderMode;
}

/**
 * Provider component for builder mode state
 */
export function BuilderModeProvider({ children, initialMode = 'manual' }: BuilderModeProviderProps) {
    const [state, setState] = useState<BuilderState>({
        ...defaultState,
        mode: initialMode,
    });

    // Mode actions
    const setMode = useCallback((mode: BuilderMode) => {
        setState(prev => ({
            ...prev,
            mode,
            // Reset editing state when switching modes
            isEditing: false,
        }));
    }, []);

    const toggleMode = useCallback(() => {
        setState(prev => ({
            ...prev,
            mode: prev.mode === 'manual' ? 'auto' : 'manual',
            isEditing: false,
        }));
    }, []);

    // Generation actions
    const setIsGenerating = useCallback((value: boolean) => {
        setState(prev => ({ ...prev, isGenerating: value }));
    }, []);

    const setIsEditing = useCallback((value: boolean) => {
        setState(prev => ({ ...prev, isEditing: value }));
    }, []);

    const setLastGenerateConfig = useCallback((config: GenerateConfig | null) => {
        setState(prev => ({ ...prev, lastGenerateConfig: config }));
    }, []);

    // Path lock actions
    const setIsPathLocked = useCallback((value: boolean) => {
        setState(prev => ({ ...prev, isPathLocked: value }));
    }, []);

    const togglePathLock = useCallback(() => {
        setState(prev => ({ ...prev, isPathLocked: !prev.isPathLocked }));
    }, []);

    // Layer actions
    const setActiveLayer = useCallback((layer: 'all' | 'ground' | 'items') => {
        setState(prev => ({ ...prev, activeLayer: layer }));
    }, []);

    // Smart snap actions
    const setSmartSnapEnabled = useCallback((value: boolean) => {
        setState(prev => ({ ...prev, smartSnapEnabled: value }));
    }, []);

    const toggleSmartSnap = useCallback(() => {
        setState(prev => ({ ...prev, smartSnapEnabled: !prev.smartSnapEnabled }));
    }, []);

    // Reset
    const resetToDefault = useCallback(() => {
        setState(defaultState);
    }, []);

    // Utility: determine if an object type can be edited based on current state
    const canEdit = useCallback((objectType: 'block' | 'collectible' | 'interactible' | 'player' | 'finish'): boolean => {
        // In manual mode, everything is editable
        if (state.mode === 'manual') return true;

        // In auto mode with editing enabled
        if (state.mode === 'auto' && state.isEditing) {
            // If path is locked, only non-block items can be edited
            if (state.isPathLocked) {
                return objectType !== 'block';
            }
            // Otherwise everything is editable
            return true;
        }

        // In auto mode without editing (pre-generate or during generate)
        return false;
    }, [state.mode, state.isEditing, state.isPathLocked]);

    const value: BuilderModeContextValue = {
        state,
        setMode,
        toggleMode,
        setIsGenerating,
        setIsEditing,
        setLastGenerateConfig,
        setIsPathLocked,
        togglePathLock,
        setActiveLayer,
        setSmartSnapEnabled,
        toggleSmartSnap,
        resetToDefault,
        canEdit,
    };

    return (
        <BuilderModeContext.Provider value={value}>
            {children}
        </BuilderModeContext.Provider>
    );
}

/**
 * Hook to access builder mode context
 */
export function useBuilderMode(): BuilderModeContextValue {
    const context = useContext(BuilderModeContext);
    if (!context) {
        throw new Error('useBuilderMode must be used within a BuilderModeProvider');
    }
    return context;
}

/**
 * Convenience hook to get just the current mode
 */
export function useCurrentMode(): BuilderMode {
    const { state } = useBuilderMode();
    return state.mode;
}

/**
 * Convenience hook to check if in editing state (post-generate)
 */
export function useIsPostGenerateEdit(): boolean {
    const { state } = useBuilderMode();
    return state.mode === 'auto' && state.isEditing;
}

export default BuilderModeContext;
