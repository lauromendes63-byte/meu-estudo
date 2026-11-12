import { describe, expect, it } from 'vitest';
import { APP_CREST_SVG, getMedicalIconSvg, matchSpecialtyByName, MEDICAL_ICONS, QUICK_SPECIALTY_PRESETS } from '../../src/icons/medical-icons.js';
import { getColorConfig, PALETTE_COLORS } from '../../src/icons/palette.js';

describe('minimalist duotone medical iconography & palette', () => {
  it('exposes all 26 medical icons with valid palette defaults and zero emojis', () => {
    expect(MEDICAL_ICONS).toHaveLength(26);
    const colorKeys = new Set(PALETTE_COLORS.map((c) => c.key));

    for (const icon of MEDICAL_ICONS) {
      expect(icon.svg).toContain('<svg');
      expect(icon.svg).toContain('#162654');
      expect(colorKeys.has(icon.defaultColor)).toBe(true);
    }

    for (const preset of QUICK_SPECIALTY_PRESETS) {
      expect(colorKeys.has(preset.color)).toBe(true);
      expect(getMedicalIconSvg(preset.icon)).toContain('<svg');
    }

    expect(APP_CREST_SVG).toContain('#162654');
    expect(getColorConfig('unknown-key').key).toBe('navy');
  });

  it('auto-matches Portuguese medical specialties accurately regardless of accents', () => {
    expect(matchSpecialtyByName('Cardiologia')?.key).toBe('heart');
    expect(matchSpecialtyByName('Fígado e Vias Biliares')?.key).toBe('gastro');
    expect(matchSpecialtyByName('Reumatologia')?.key).toBe('reuma');
    expect(matchSpecialtyByName('Psiquiatria Clínica')?.key).toBe('psiq');
    expect(matchSpecialtyByName('Técnica Cirúrgica')?.key).toBe('scalpel');
    expect(matchSpecialtyByName('x')).toBeNull();
  });
});
