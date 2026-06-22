import React from 'react';
import { useTestMode } from '../../context/TestModeContext';

export const TestModeBanner: React.FC = () => {
  const { enabled, toggle } = useTestMode();
  if (!enabled) {
    return null;
  }
  return (
    <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-center justify-between gap-3">
      <span>
        <strong>Mode test</strong> — validation uniquement, aucune commande envoyée à l&apos;armoire.
      </span>
      <button
        type="button"
        onClick={toggle}
        className="shrink-0 text-xs font-medium underline hover:no-underline"
      >
        Désactiver
      </button>
    </div>
  );
};
