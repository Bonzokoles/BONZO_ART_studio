import React, { useState, useEffect } from 'react';
import type { ProviderId } from '../types';
import {
  PROVIDER_KEY_MAP,
  PROVIDER_LABELS,
  PROVIDER_COLORS,
  getKey,
  setKey,
  removeKey,
  hasKey,
  testProviderKey,
  KeyTestResult,
} from '../services/keyStorage';
import { Key, CheckCircle, XCircle, Eye, EyeOff, Shield, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';

const PROVIDER_LIST: ProviderId[] = ['google', 'fal', 'replicate', 'openai'];

export const ApiKeyDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [keyValues, setKeyValues] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, KeyTestResult & { testing?: boolean }>>({});

  const reloadKeys = () => {
    const vals: Record<string, string> = {};
    PROVIDER_LIST.forEach((p) => {
      const kName = PROVIDER_KEY_MAP[p];
      vals[p] = getKey(kName);
    });
    setKeyValues(vals);
  };

  useEffect(() => {
    reloadKeys();
    const handleUpdate = () => reloadKeys();
    window.addEventListener('bonzo-keys-updated', handleUpdate);
    return () => window.removeEventListener('bonzo-keys-updated', handleUpdate);
  }, []);

  const handleSave = (provider: ProviderId) => {
    const kName = PROVIDER_KEY_MAP[provider];
    const val = keyValues[provider] || '';
    setKey(kName, val);
    setTestResults((prev) => ({
      ...prev,
      [provider]: { ok: true, message: 'Key saved to localStorage' },
    }));
  };

  const handleClear = (provider: ProviderId) => {
    const kName = PROVIDER_KEY_MAP[provider];
    removeKey(kName);
    setKeyValues((prev) => ({ ...prev, [provider]: '' }));
    setTestResults((prev) => ({
      ...prev,
      [provider]: { ok: false, message: 'Key removed from localStorage' },
    }));
  };

  const handleTest = async (provider: ProviderId) => {
    setTestResults((prev) => ({
      ...prev,
      [provider]: { ok: false, message: 'Testing connectivity...', testing: true },
    }));

    const val = keyValues[provider];
    const res = await testProviderKey(provider, val);

    setTestResults((prev) => ({
      ...prev,
      [provider]: { ...res, testing: false },
    }));
  };

  const toggleShow = (provider: ProviderId) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const configuredCount = PROVIDER_LIST.filter((p) => hasKey(PROVIDER_KEY_MAP[p])).length;

  return (
    <div
      id="api-keys-drawer"
      className="border-t border-[#1f2937] bg-[#11131a] font-mono text-[11px] select-none shrink-0"
    >
      {/* Header bar toggle */}
      <div
        id="api-keys-drawer-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-[#181b22] transition-colors"
      >
        <div className="flex items-center space-x-3">
          <Key size={13} className="text-[#d4a574]" />
          <span className="font-bold text-[#ffffff] uppercase tracking-wider text-xs">
            API KEYS CONFIGURATION
          </span>
          <span className="border border-[#1f2937] px-1.5 py-0.5 bg-[#0b0d12] text-[#9ca3af] text-[10px]">
            [{configuredCount}/{PROVIDER_LIST.length} CONFIGURED]
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[10px]">
          <div className="hidden sm:flex items-center space-x-2">
            {PROVIDER_LIST.map((p) => {
              const active = hasKey(PROVIDER_KEY_MAP[p]);
              return (
                <span
                  key={p}
                  className="px-1.5 py-0.5 border border-[#1f2937] bg-[#0b0d12]"
                  style={{ color: active ? '#10b981' : '#6b7280' }}
                >
                  {PROVIDER_LABELS[p]}: {active ? '[OK]' : '[MISSING]'}
                </span>
              );
            })}
          </div>

          <button
            type="button"
            className="flex items-center space-x-1 text-[#d4a574] hover:text-[#e0b585] uppercase font-bold"
          >
            <span>{isOpen ? '[COLLAPSE]' : '[EXPAND]'}</span>
            {isOpen ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
        </div>
      </div>

      {/* Expanded Keys Panel */}
      {isOpen && (
        <div
          id="api-keys-drawer-content"
          className="w-full px-4 py-3 border-t border-[#1f2937] space-y-3 bg-[#0e1017]"
        >
          <div className="text-[#9ca3af] text-[10px] flex items-center justify-between pb-1 border-b border-[#1f2937]">
            <span>
              All keys are stored securely in your browser's <code className="text-[#d4a574]">localStorage</code> (keys are never logged to external servers).
            </span>
            <span className="text-[#6b7280]">PREFIX: bonzo-studio-key-*</span>
          </div>

          <div className="space-y-2">
            {PROVIDER_LIST.map((p) => {
              const kName = PROVIDER_KEY_MAP[p];
              const isConfigured = hasKey(kName);
              const test = testResults[p];
              const isVisible = showKeys[p];

              return (
                <div
                  key={p}
                  className="bg-[#11131a] border border-[#1f2937] p-2.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-2"
                >
                  {/* Provider label & badge */}
                  <div className="flex items-center space-x-2.5 min-w-[140px]">
                    <div
                      className="w-2.5 h-2.5"
                      style={{ backgroundColor: PROVIDER_COLORS[p] }}
                    />
                    <span className="font-bold text-[#ffffff] uppercase tracking-wider">
                      {PROVIDER_LABELS[p]}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 font-bold uppercase ${
                        isConfigured
                          ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/40'
                          : 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/40'
                      }`}
                    >
                      {isConfigured ? '[CONFIGURED]' : '[MISSING]'}
                    </span>
                  </div>

                  {/* Input field and actions */}
                  <div className="flex-1 w-full flex items-center space-x-1.5">
                    <div className="relative flex-1">
                      <input
                        type={isVisible ? 'text' : 'password'}
                        value={keyValues[p] || ''}
                        onChange={(e) =>
                          setKeyValues((prev) => ({ ...prev, [p]: e.target.value }))
                        }
                        placeholder={`Enter ${kName}...`}
                        className="w-full bg-[#0b0d12] border border-[#1f2937] px-2.5 py-1.5 text-[#ffffff] placeholder-[#525660] focus:border-[#d4a574] focus:outline-none pr-8 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShow(p)}
                        className="absolute right-2 top-2 text-[#6b7280] hover:text-[#ffffff]"
                        title={isVisible ? 'Hide key' : 'Show key'}
                      >
                        {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSave(p)}
                      className="bg-[#181b22] hover:bg-[#22252f] text-[#ffffff] border border-[#2a3140] hover:border-[#d4a574] px-2.5 py-1.5 uppercase font-bold text-[10px] transition-colors"
                    >
                      [SAVE]
                    </button>

                    {isConfigured && (
                      <button
                        type="button"
                        onClick={() => handleClear(p)}
                        className="bg-[#181b22] hover:bg-[#2b1616] text-[#ef4444] border border-[#2a3140] hover:border-[#ef4444] px-2.5 py-1.5 uppercase font-bold text-[10px] transition-colors"
                      >
                        [CLEAR]
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={test?.testing}
                      onClick={() => handleTest(p)}
                      className="bg-[#181b22] hover:bg-[#1c2230] text-[#4285f4] border border-[#2a3140] hover:border-[#4285f4] px-2.5 py-1.5 uppercase font-bold text-[10px] transition-colors flex items-center space-x-1 disabled:opacity-50"
                    >
                      {test?.testing ? (
                        <RefreshCw size={11} className="animate-spin" />
                      ) : (
                        <span>[TEST]</span>
                      )}
                    </button>
                  </div>

                  {/* Test Feedback */}
                  {test && (
                    <div
                      className={`text-[10px] shrink-0 font-mono flex items-center space-x-1 ${
                        test.ok ? 'text-[#10b981]' : 'text-[#ef4444]'
                      }`}
                    >
                      {test.ok ? <CheckCircle size={11} /> : <XCircle size={11} />}
                      <span>{test.message}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
