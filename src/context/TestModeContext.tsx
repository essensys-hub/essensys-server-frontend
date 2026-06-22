import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isTestModeEnabled, setTestModeEnabled } from '../testMode';

interface TestModeContextValue {
  enabled: boolean;
  setEnabled: (on: boolean) => void;
  toggle: () => void;
}

const TestModeContext = createContext<TestModeContextValue | null>(null);

export const TestModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enabled, setEnabledState] = useState(() => isTestModeEnabled());

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('test') === '1') {
      setTestModeEnabled(true);
      setEnabledState(true);
    }
  }, []);

  const setEnabled = useCallback((on: boolean) => {
    setTestModeEnabled(on);
    setEnabledState(on);
  }, []);

  const toggle = useCallback(() => {
    setEnabled(!enabled);
  }, [enabled, setEnabled]);

  const value = useMemo(
    () => ({ enabled, setEnabled, toggle }),
    [enabled, setEnabled, toggle],
  );

  return <TestModeContext.Provider value={value}>{children}</TestModeContext.Provider>;
};

export function useTestMode(): TestModeContextValue {
  const ctx = useContext(TestModeContext);
  if (!ctx) {
    throw new Error('useTestMode must be used within TestModeProvider');
  }
  return ctx;
}
