import { describe, expect, it } from 'vitest';
import { formatMacro } from '../../lib/formatNutrition';

describe('formatMacro', () => {
  it('renders an em dash for null values', () => {
    expect(formatMacro(null)).toBe('—');
    expect(formatMacro(null, 'g')).toBe('—');
  });

  it('formats integers without decimals and appends units', () => {
    expect(formatMacro(320)).toBe('320');
    expect(formatMacro(18, 'g')).toBe('18g');
  });

  it('rounds fractional values to one decimal place', () => {
    expect(formatMacro(3.62, 'g')).toBe('3.6g');
    expect(formatMacro(3.05, 'mg')).toBe('3.1mg');
  });
});
