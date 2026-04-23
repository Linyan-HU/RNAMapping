const COMMON = {
  light: {
    surface: '#FFFFFF',
    surfaceAlt: '#EEF3EE',
    background: '#F4F7F2',
    backgroundStrong: '#E8EFE8',
    textPrimary: '#14221C',
    textSecondary: '#5D6C64',
    textMuted: '#7B8A82',
    onPrimary: '#F4F7F2',
    shadow: '0 18px 50px rgba(20, 34, 28, 0.08)',
    shadowSoft: '0 10px 28px rgba(20, 34, 28, 0.06)',
    radiusCard: '22px',
    radiusPanel: '16px'
  },
};

export const themeTokens = {
  blue: {
    label: 'Scientific Green',
    light: {
      primary: '#174B3A',
      primaryHover: '#123B2E',
      primarySoft: '#E4EFE8',
      accent: '#2F8F6B',
      accentSoft: '#C7E36B',
      border: '#D6E0D8'
    },
  }
};

export function cssVarsFor(themeKey, mode = 'light') {
  const theme = themeTokens[themeKey] ?? themeTokens.blue;
  const safeMode = mode === 'dark' ? 'dark' : 'light';
  const merged = { ...COMMON[safeMode], ...theme[safeMode] };
  const entries = Object.entries(merged).map(([k, v]) => `--${k}: ${v};`);
  entries.push(`--mode: ${safeMode};`);
  return entries.join('\n');
}
