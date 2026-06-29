export interface ThemeConfig {
  id: string;
  name: string;
  brandBlack: string;      // --color-brand-black
  brandCharcoal: string;   // --color-brand-charcoal
  brandOffwhite: string;   // --color-brand-offwhite
  brandLightgray: string;  // --color-brand-lightgray
  brandGold: string;       // --color-brand-gold
}

export const THEME_PRESETS: ThemeConfig[] = [
  {
    id: 'charcoal-gold',
    name: '👑 Classic Premium Charcoal & Gold',
    brandBlack: '#000000',
    brandCharcoal: '#1a1a1a',
    brandOffwhite: '#fcfcfd',
    brandLightgray: '#f5f5f7',
    brandGold: '#ca8a04'
  },
  {
    id: 'royal-crimson',
    name: '🍷 Royal Crimson & Ivory',
    brandBlack: '#6b0d18',
    brandCharcoal: '#8c1a26',
    brandOffwhite: '#fdfbf7',
    brandLightgray: '#f7f2e8',
    brandGold: '#b45309'
  },
  {
    id: 'midnight-sapphire',
    name: '🌌 Midnight Sapphire & Premium Silver',
    brandBlack: '#0b1329',
    brandCharcoal: '#1c2541',
    brandOffwhite: '#f8fafc',
    brandLightgray: '#f1f5f9',
    brandGold: '#3b82f6'
  },
  {
    id: 'imperial-emerald',
    name: '🌿 Imperial Emerald & Soft Mint',
    brandBlack: '#022c22',
    brandCharcoal: '#064e3b',
    brandOffwhite: '#f0fdf4',
    brandLightgray: '#dcfce7',
    brandGold: '#059669'
  },
  {
    id: 'luxe-rose',
    name: '🌸 Luxe Rose & Romantic Blush',
    brandBlack: '#470a1a',
    brandCharcoal: '#5c0f24',
    brandOffwhite: '#fff5f5',
    brandLightgray: '#ffe3e3',
    brandGold: '#d01c5a'
  },
  {
    id: 'earthy-terracotta',
    name: '🧱 Warm Sand & Terracotta',
    brandBlack: '#451a03',
    brandCharcoal: '#78350f',
    brandOffwhite: '#fefcfb',
    brandLightgray: '#fcf6f0',
    brandGold: '#c2410c'
  }
];

export const THEME_STORAGE_KEY = 'store_theme_custom_config';

/**
 * Retrieves the currently configured theme, fallback to default charcoal-gold
 */
export function getSavedTheme(): ThemeConfig {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.brandBlack) {
        return parsed as ThemeConfig;
      }
    }
  } catch (e) {
    console.error('Error parsing theme config:', e);
  }
  return THEME_PRESETS[0]; // default
}

/**
 * Saves and applies theme variables to document root element
 */
export function saveAndApplyTheme(config: ThemeConfig) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(config));
    applyThemeToDOM(config);
    // Dispatch global custom event for real-time reactivity
    window.dispatchEvent(new CustomEvent('store_theme_changed', { detail: config }));
  } catch (e) {
    console.error('Error saving theme:', e);
  }
}

/**
 * Directly writes CSS custom properties on document.documentElement
 */
export function applyThemeToDOM(config: ThemeConfig) {
  if (!config) return;
  const root = document.documentElement;
  root.style.setProperty('--color-brand-black', config.brandBlack);
  root.style.setProperty('--color-brand-charcoal', config.brandCharcoal);
  root.style.setProperty('--color-brand-offwhite', config.brandOffwhite);
  root.style.setProperty('--color-brand-lightgray', config.brandLightgray);
  root.style.setProperty('--color-brand-gold', config.brandGold);
  
  // Also, for Tailwind/body default styling, set backgrounds
  document.body.style.backgroundColor = config.brandOffwhite;
  document.body.style.color = config.brandBlack;
}
