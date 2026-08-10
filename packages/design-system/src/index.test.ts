import { describe, expect, it } from 'vitest';
import { colors, tokens } from './index';

describe('design tokens', () => {
  it('exposes premium dark brand palette', () => {
    expect(colors.background.base.startsWith('#')).toBe(true);
    expect(colors.brand.pink).toBe('#FF4FA3');
    expect(colors.brand.purple).toBe('#8B5CF6');
    expect(colors.brand.blue).toBe('#4CC9F0');
    expect(tokens.colors.state.locked).toBeDefined();
    expect(tokens.colors.state.focus).toBeDefined();
  });
});
