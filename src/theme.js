const COMMON = {
  light: {
    surface: '#FFFFFF',
    background: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#334155',
    onPrimary: '#C35C6A'
  },
};

export const themeTokens = {
  blue: {
    label: 'Blue',
    light: { primary: '#0F172A', primaryHover: '#BEC936', primarySoft: '#FFFFFF', accent: '#207F4C', border: '#E5E7EB' },
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
