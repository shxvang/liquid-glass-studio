import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { createSheeshmahalConfig } from '../../../../core/src/index.js';
import {
  SMCanvasContext,
  type CanvasContextValue,
} from '../../canvas/CanvasProvider.js';
import { useSpringPreset } from '../useSpringPreset.js';

describe('useSpringPreset', () => {
  it('returns preset configuration merged with overrides', () => {
    const sheeshConfig = createSheeshmahalConfig();
    const contextValue: CanvasContextValue = {
      theme: sheeshConfig.theme,
      animationPresets: sheeshConfig.animationPresets,
      reducedMotion: false,
      portalRoot: null,
      setPortalRoot: () => {},
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <SMCanvasContext.Provider value={contextValue}>{children}</SMCanvasContext.Provider>
    );

    const { result } = renderHook(() => useSpringPreset('hover', { tension: 500 }), {
      wrapper,
    });

    expect(result.current.config.tension).toBe(500);
    expect(result.current.immediate).toBeTypeOf('boolean');
  });
});
