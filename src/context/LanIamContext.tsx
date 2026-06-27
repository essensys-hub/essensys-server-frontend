import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { isLanIamBuildFlag, resolveLanIamEnabled } from '../lib/lanIamMode';

type LanIamContextValue = {
  enabled: boolean;
  loading: boolean;
};

const LanIamContext = createContext<LanIamContextValue>({
  enabled: isLanIamBuildFlag(),
  loading: !isLanIamBuildFlag(),
});

export function LanIamProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(isLanIamBuildFlag());
  const [loading, setLoading] = useState(!isLanIamBuildFlag());

  useEffect(() => {
    let cancelled = false;
    void resolveLanIamEnabled().then((on) => {
      if (!cancelled) {
        setEnabled(on);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <LanIamContext.Provider value={{ enabled, loading }}>{children}</LanIamContext.Provider>
  );
}

export function useLanIamMode() {
  return useContext(LanIamContext);
}
