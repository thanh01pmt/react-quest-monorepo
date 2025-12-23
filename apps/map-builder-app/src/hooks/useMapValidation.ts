/**
 * useMapValidation Hook
 * 
 * Provides unified validation for both Manual and Auto modes.
 * Auto-validates on change with debounce for performance.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PlacedObject } from '../types';
import { IPathInfo } from '@repo/academic-map-generator';
import { validateMap, ValidationReport, MapDataForValidation } from '@repo/academic-map-generator';
import { PedagogyStrategy } from '@repo/academic-map-generator';
import { usePathTracer, TracedPath } from './usePathTracer';
import { BuilderMode } from '../store/builderModeContext';

interface UseMapValidationOptions {
  /** Placed objects on the map */
  placedObjects: PlacedObject[];
  /** Path info from topology generator (Auto mode) */
  pathInfo?: IPathInfo | null;
  /** Current builder mode */
  mode: BuilderMode;
  /** Current pedagogy strategy */
  strategy: PedagogyStrategy;
  /** Debounce delay in ms */
  debounceMs?: number;
  /** Whether to auto-validate on change */
  autoValidate?: boolean;
}

interface UseMapValidationResult {
  /** Current validation report */
  validationReport: ValidationReport | null;
  /** Whether validation is in progress */
  isValidating: boolean;
  /** Trigger validation manually */
  validateNow: () => void;
  /** Traced path (for manual mode) */
  tracedPath: TracedPath;
  /** Quick validation status */
  status: 'valid' | 'warning' | 'invalid' | 'unknown';
  /** Status message */
  statusMessage: string;
}

/**
 * Hook for unified map validation
 */
export function useMapValidation({
  placedObjects,
  pathInfo,
  mode,
  strategy,
  debounceMs = 300,
  autoValidate = true,
}: UseMapValidationOptions): UseMapValidationResult {
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Use path tracer for manual mode
  const tracedPath = usePathTracer(placedObjects);

  // Build pathInfo for manual mode from traced path
  const effectivePathInfo = useMemo((): IPathInfo | null => {
    if (mode === 'auto' && pathInfo) {
      return pathInfo;
    }

    // Manual mode: construct pathInfo from traced path
    if (!tracedPath.startFound || !tracedPath.finishFound) {
      return null;
    }

    // Find start and finish objects
    const startObj = placedObjects.find(
      obj => obj.asset.key === 'player_start'
    );
    const finishObj = placedObjects.find(
      obj => obj.asset.key === 'finish' || obj.asset.key === 'goal'
    );

    if (!startObj || !finishObj) return null;

    return {
      start_pos: startObj.position as [number, number, number],
      target_pos: finishObj.position as [number, number, number],
      path_coords: tracedPath.path,
      placement_coords: tracedPath.path.slice(1, -1), // Exclude start and finish
      obstacles: [],
      metadata: { mode: 'manual' },
    };
  }, [mode, pathInfo, tracedPath, placedObjects]);

  // Validation function
  const runValidation = useCallback(() => {
    if (!effectivePathInfo) {
      // Create a minimal report for missing path
      const report: ValidationReport = {
        isValid: false,
        tier1: {
          tier: 1,
          passed: false,
          checks: [
            {
              name: 'Path Exists',
              passed: false,
              message: mode === 'manual' 
                ? (tracedPath.startFound 
                    ? (tracedPath.finishFound 
                        ? 'No valid path from start to finish'
                        : 'Finish position not found')
                    : 'Start position not found')
                : 'No path info available. Generate a map first.',
            }
          ],
        },
        tier2: {
          tier: 2,
          passed: false,
          checks: [],
        },
        tier3: {
          tier: 3,
          passed: false,
          checks: [],
        },
        summary: mode === 'manual' 
          ? 'Map is missing required elements'
          : 'Generate a map to validate',
        suggestions: mode === 'manual'
          ? ['Place a player_start object', 'Place a finish object', 'Ensure a connected path exists']
          : ['Click Generate to create a map'],
      };
      setValidationReport(report);
      setIsValidating(false);
      return;
    }

    setIsValidating(true);

    try {
      const mapData: MapDataForValidation = {
        objects: placedObjects,
        pathInfo: effectivePathInfo,
        strategy: strategy,
        logicType: strategy,
      };

      const report = validateMap(mapData);
      setValidationReport(report);
    } catch (error) {
      console.error('Validation error:', error);
      setValidationReport({
        isValid: false,
        tier1: {
          tier: 1,
          passed: false,
          checks: [{ name: 'Validation', passed: false, message: 'Validation failed with error' }],
        },
        tier2: { tier: 2, passed: false, checks: [] },
        tier3: { tier: 3, passed: false, checks: [] },
        summary: 'Validation error occurred',
        suggestions: ['Check console for details'],
      });
    } finally {
      setIsValidating(false);
    }
  }, [effectivePathInfo, placedObjects, strategy, mode, tracedPath]);

  // Debounced auto-validation
  useEffect(() => {
    if (!autoValidate) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      runValidation();
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [placedObjects, effectivePathInfo, strategy, autoValidate, debounceMs, runValidation]);

  // Manual validation trigger
  const validateNow = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    runValidation();
  }, [runValidation]);

  // Compute quick status
  const { status, statusMessage } = useMemo(() => {
    if (!validationReport) {
      return { status: 'unknown' as const, statusMessage: 'Not validated' };
    }

    if (validationReport.isValid) {
      return { status: 'valid' as const, statusMessage: 'Map is valid' };
    }

    if (validationReport.tier1.passed) {
      if (validationReport.tier2.passed) {
        return { status: 'warning' as const, statusMessage: 'Minor pedagogy issues' };
      }
      return { status: 'warning' as const, statusMessage: 'Logic issues detected' };
    }

    return { status: 'invalid' as const, statusMessage: 'Map has critical issues' };
  }, [validationReport]);

  return {
    validationReport,
    isValidating,
    validateNow,
    tracedPath,
    status,
    statusMessage,
  };
}

export default useMapValidation;
