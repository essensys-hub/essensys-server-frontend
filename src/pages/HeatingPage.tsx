import React, { useState } from 'react';
import { FireIcon } from '@heroicons/react/24/outline';
import { PageHeader, ControlCard, ActionButton } from '../components/UI';
import { sendInjection } from '../services/legacyApi';

interface HeatingMode {
  value: string;
  label: string;
  dindex: number;
}

interface HeatingZone {
  id: string;
  name: string;
  modes: HeatingMode[];
}

const standardModes: Omit<HeatingMode, 'dindex'>[] = [
  { value: '1', label: 'Automatique (planning)' },
  { value: '32', label: 'Anticipé' },
  { value: '17', label: 'Forçage confort' },
  { value: '18', label: 'Forçage éco' },
  { value: '19', label: 'Forçage éco+' },
  { value: '20', label: 'Forçage éco++' },
  { value: '21', label: 'Forçage hors gel' },
  { value: '16', label: 'OFF' },
];

const sdbModes: Omit<HeatingMode, 'dindex'>[] = [
  { value: '1', label: 'Automatique (planning)' },
  { value: '17', label: 'Forçage confort' },
  { value: '18', label: 'Forçage éco' },
  { value: '19', label: 'Forçage éco+' },
  { value: '20', label: 'Forçage éco++' },
  { value: '21', label: 'Forçage hors gel' },
  { value: '16', label: 'OFF' },
];

const zones: HeatingZone[] = [
  { id: 'zj', name: 'Zone Jour', modes: standardModes.map(m => ({ ...m, dindex: 100 })) },
  { id: 'zn', name: 'Zone Nuit', modes: standardModes.map(m => ({ ...m, dindex: 101 })) },
  { id: 'sdb1', name: 'Salle de bain 1', modes: sdbModes.map(m => ({ ...m, dindex: 102 })) },
  { id: 'sdb2', name: 'Salle de bain 2', modes: sdbModes.map(m => ({ ...m, dindex: 103 })) },
];

export const HeatingPage: React.FC = () => {
  const [loadingZone, setLoadingZone] = useState<string | null>(null);
  const [loadingMode, setLoadingMode] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleModeSelect = async (zone: HeatingZone, mode: HeatingMode) => {
    setLoadingZone(zone.id);
    setLoadingMode(mode.value);
    setSuccess(null);

    try {
      await sendInjection(mode.dindex, mode.value);
      setSuccess(`${zone.name} : ${mode.label}`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingZone(null);
      setLoadingMode(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Chauffage"
        description="Contrôle des différentes zones de chauffage"
        icon={FireIcon}
        backLink="/dashboard"
        backLabel="Tableau de bord"
      />

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            <strong>Commande envoyée :</strong> {success}
          </p>
        </div>
      )}

      <div className="space-y-6">
        {zones.map((zone) => (
          <ControlCard key={zone.id} title={zone.name}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {zone.modes.map((mode) => (
                <ActionButton
                  key={`${zone.id}-${mode.value}`}
                  label={mode.label}
                  variant={mode.value === '16' ? 'secondary' : 'primary'}
                  onClick={() => handleModeSelect(zone, mode)}
                  loading={loadingZone === zone.id && loadingMode === mode.value}
                  disabled={loadingZone !== null}
                  size="sm"
                  className="w-full"
                />
              ))}
            </div>
          </ControlCard>
        ))}
      </div>
    </div>
  );
};

export default HeatingPage;
