import type { SavedStylePreset } from '../data/artistsData';

const STYLES_STORAGE_KEY = 'bonzo-studio-styles';
const MAX_SAVED_STYLES = 50;

export const loadSavedStyles = (): SavedStylePreset[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STYLES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load saved styles from localStorage:', err);
  }
  return [];
};

export const saveStylePreset = (
  data: Omit<SavedStylePreset, 'id' | 'timestamp'>
): SavedStylePreset => {
  const current = loadSavedStyles();
  const newPreset: SavedStylePreset = {
    ...data,
    id: `style-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toTimeString().split(' ')[0],
  };

  const updated = [newPreset, ...current.filter((item) => item.id !== newPreset.id)].slice(
    0,
    MAX_SAVED_STYLES
  );

  try {
    localStorage.setItem(STYLES_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bonzo-styles-updated'));
    }
  } catch (err) {
    console.warn('Failed to save style preset to localStorage:', err);
  }

  return newPreset;
};

export const deleteStylePreset = (id: string): void => {
  const current = loadSavedStyles();
  const updated = current.filter((item) => item.id !== id);
  try {
    localStorage.setItem(STYLES_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bonzo-styles-updated'));
    }
  } catch (err) {
    console.warn('Failed to delete style preset:', err);
  }
};

export const clearAllStyles = (): void => {
  try {
    localStorage.removeItem(STYLES_STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bonzo-styles-updated'));
    }
  } catch (err) {
    console.warn('Failed to clear style presets:', err);
  }
};
