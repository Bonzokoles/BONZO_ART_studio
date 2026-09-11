import { ProviderId } from '../types';

export const KEY_PREFIX = 'bonzo-studio-key-';

export const PROVIDER_KEY_MAP: Record<ProviderId, string> = {
  google: 'GEMINI_API_KEY',
  fal: 'FAL_KEY',
  replicate: 'REPLICATE_API_TOKEN',
  openai: 'OPENAI_API_KEY',
  local: 'LOCAL_SD_URL',
  pollinations: '', // no key required — free, URL-based
};

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  google: 'Google',
  fal: 'fal.ai',
  replicate: 'Replicate',
  openai: 'OpenAI',
  local: 'Local SD',
  pollinations: 'Pollinations',
};

export const PROVIDER_COLORS: Record<ProviderId, string> = {
  google: '#4285f4',
  fal: '#7c3aed',
  replicate: '#0066ff',
  openai: '#10a37f',
  local: '#6b7280',
  pollinations: '#14b8a6',
};

export const getKey = (keyName: string): string => {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem(KEY_PREFIX + keyName);
  if (stored) return stored;

  // Fallback for all API keys in process.env injected by Vite
  const envVal = (process.env as any)[keyName];
  if (envVal) return envVal;

  // Fallback for Google API key in standard environments
  if (keyName === 'GEMINI_API_KEY') {
    return process.env.API_KEY || (window as any).__GEMINI_API_KEY__ || '';
  }
  return '';
};

export const setKey = (keyName: string, val: string): void => {
  if (typeof window === 'undefined') return;
  if (!val.trim()) {
    localStorage.removeItem(KEY_PREFIX + keyName);
  } else {
    localStorage.setItem(KEY_PREFIX + keyName, val.trim());
  }
  window.dispatchEvent(new Event('bonzo-keys-updated'));
};

export const removeKey = (keyName: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY_PREFIX + keyName);
  window.dispatchEvent(new Event('bonzo-keys-updated'));
};

export const hasKey = (keyName: string): boolean => {
  return !!getKey(keyName);
};

export const hasProviderKey = (provider: ProviderId): boolean => {
  const keyName = PROVIDER_KEY_MAP[provider];
  if (!keyName) return false;
  return hasKey(keyName);
};

export interface KeyTestResult {
  ok: boolean;
  message: string;
  statusCode?: number;
}

export const testProviderKey = async (
  provider: ProviderId,
  overrideKey?: string
): Promise<KeyTestResult> => {
  const keyName = PROVIDER_KEY_MAP[provider];
  const key = overrideKey !== undefined ? overrideKey : getKey(keyName);

  if (!key && provider !== 'local') {
    return { ok: false, message: 'No API key provided' };
  }

  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  try {
    switch (provider) {
      case 'google': {
        const url = isLocalhost
          ? `/api-google/v1beta/models?key=${key}`
          : `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const res = await fetch(url, { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          const count = data.models?.length || 0;
          return { ok: true, message: `Connected! ${count} models available`, statusCode: res.status };
        }
        const errData = await res.json().catch(() => ({}));
        return {
          ok: false,
          message: errData.error?.message || `HTTP ${res.status} Authentication failed`,
          statusCode: res.status,
        };
      }

      case 'fal': {
        const url = isLocalhost ? '/api-fal-rest/v1/models' : 'https://api.fal.ai/v1/models';
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Key ${key}`,
            'Content-Type': 'application/json',
          },
        });
        if (res.ok || res.status === 200) {
          return { ok: true, message: 'Connected to fal.ai API gateway', statusCode: res.status };
        }
        return {
          ok: false,
          message: `HTTP ${res.status}: Check FAL_KEY permissions`,
          statusCode: res.status,
        };
      }

      case 'replicate': {
        const url = isLocalhost ? '/api-replicate/v1/account' : 'https://api.replicate.com/v1/account';
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          const data = await res.json();
          return { ok: true, message: `Connected as [${data.username || 'User'}]`, statusCode: res.status };
        }
        return {
          ok: false,
          message: `HTTP ${res.status}: Invalid Replicate token`,
          statusCode: res.status,
        };
      }

      case 'openai': {
        const url = isLocalhost ? '/api-openai/v1/models' : 'https://api.openai.com/v1/models';
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          return { ok: true, message: 'Connected to OpenAI API', statusCode: res.status };
        }
        return {
          ok: false,
          message: `HTTP ${res.status}: Invalid OpenAI API key`,
          statusCode: res.status,
        };
      }

      case 'local': {
        const url = key || 'http://localhost:7860';
        const res = await fetch(`${url}/sdapi/v1/sd-models`, { method: 'GET' });
        if (res.ok) {
          return { ok: true, message: 'Connected to Local SD/Forge', statusCode: res.status };
        }
        return { ok: false, message: `Could not reach ${url}`, statusCode: res.status };
      }

      default:
        return { ok: false, message: 'Unknown provider' };
    }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Network test error',
    };
  }
};
