import React, { useCallback, useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { LightTimerControl } from './LightTimerControl';
import { useLightTimers } from '../../lights/useLightTimers';

interface LightTimerPanelProps {
  id: string;
  online: boolean;
  dryRun: boolean;
}

/** Panneau repliable de la page Éclairage ; la valeur n'est lue qu'à l'ouverture. */
export const LightTimerPanel: React.FC<LightTimerPanelProps> = ({ id, online, dryRun }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2" data-testid={`light-timer-panel-${id}`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-sm text-essensys-primary hover:underline"
      >
        Temporisation
        {open ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
      </button>
      {open && <LightTimerPanelBody id={id} online={online} dryRun={dryRun} />}
    </div>
  );
};

const LightTimerPanelBody: React.FC<LightTimerPanelProps> = ({ id, online, dryRun }) => {
  const { timers, loading, error, refresh } = useLightTimers();
  const current = timers.find((t) => t.id === id)?.minutes ?? null;
  const readMinutes = useCallback(async () => (await refresh()).find((t) => t.id === id)?.minutes ?? null, [refresh, id]);

  if (loading) return <p className="mt-2 text-sm text-gray-500">Lecture de la temporisation…</p>;
  if (error) return <p className="mt-2 text-sm text-red-700">{error}</p>;
  return (
    <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg">
      <LightTimerControl id={id} minutes={current} online={online} dryRun={dryRun} readMinutes={readMinutes} />
    </div>
  );
};

export default LightTimerPanel;
