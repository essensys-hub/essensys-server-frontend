import React, { useCallback } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { PageHeader, ControlCard } from '../components/UI';
import { LightTimerControl } from '../components/Lighting/LightTimerControl';
import { useArmoireSnapshot } from '../hooks/useArmoireSnapshot';
import { useTestMode } from '../context/TestModeContext';
import { useCanAdminLightTimers, useLightTimers } from '../lights/useLightTimers';
import { useLightNames } from '../lights/useLightNames';
import { LIGHT_TIMERS, formatMinutes } from '../lights/lightTimers';
import { layoutItems } from '../layout/objectLayout';
import { useObjectLayout } from '../layout/useObjectLayout';

export const LightTimersPage: React.FC = () => {
  const canAdmin = useCanAdminLightTimers();
  const { snapshot } = useArmoireSnapshot();
  const { enabled: testMode } = useTestMode();
  const { timers, loading, error, refresh } = useLightTimers();
  const { nameOf } = useLightNames();
  const { layout } = useObjectLayout('lights');

  const readOne = useCallback(
    (id: string) => async () => (await refresh()).find((t) => t.id === id)?.minutes ?? null,
    [refresh],
  );

  return (
    <div>
      <PageHeader
        title="Temporisations"
        description="Délai d'extinction automatique des lumières"
        icon={ClockIcon}
        backLink="/lighting"
        backLabel="Éclairage"
      />

      {!canAdmin ? (
        <p className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900" data-testid="light-timers-forbidden">
          Réservé à l&apos;administrateur de l&apos;armoire.
        </p>
      ) : (
        <>
          {testMode && (
            <div className="mb-6 p-3 bg-amber-50 border border-amber-300 rounded-lg text-sm text-amber-900">
              Mode test actif — les réglages sont validés sans être envoyés à l&apos;armoire.
            </div>
          )}
          {error && <p className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</p>}
          {loading ? (
            <p className="text-sm text-gray-500">Lecture des temporisations…</p>
          ) : (
            <ul className="space-y-4" data-testid="light-timers-list">
              {layoutItems('lights', LIGHT_TIMERS, layout).map((entry) => {
                const minutes = timers.find((t) => t.id === entry.id)?.minutes ?? null;
                return (
                  <li key={entry.id} data-testid={`light-timers-item-${entry.id}`}>
                    <ControlCard title={nameOf(entry.id, entry.label)} description={`Actuellement : ${formatMinutes(minutes)}`}>
                      <LightTimerControl
                        id={entry.id}
                        minutes={minutes}
                        online={snapshot?.connected ?? false}
                        dryRun={testMode}
                        readMinutes={readOne(entry.id)}
                      />
                    </ControlCard>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default LightTimersPage;
