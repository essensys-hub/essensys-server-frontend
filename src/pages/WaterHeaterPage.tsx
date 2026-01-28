import React, { useState } from 'react';
import { BeakerIcon } from '@heroicons/react/24/outline';
import { PageHeader, ControlCard } from '../components/UI';
import { sendInjection } from '../services/legacyApi';

interface WaterHeaterMode {
  value: string;
  label: string;
  description: string;
  dindex: number;
}

const modes: WaterHeaterMode[] = [
  { 
    value: 'auto', 
    label: 'ON Autonome', 
    description: 'Chauffe en permanence',
    dindex: 400 
  },
  { 
    value: 'hphc', 
    label: 'Suivi HP/HC', 
    description: 'Chauffe uniquement en heures creuses',
    dindex: 401 
  },
  { 
    value: 'off', 
    label: 'OFF', 
    description: 'Arrêt complet du chauffe-eau',
    dindex: 402 
  },
];

export const WaterHeaterPage: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleModeSelect = async (mode: WaterHeaterMode) => {
    setLoading(mode.value);
    setSuccess(null);

    try {
      await sendInjection(mode.dindex, '1');
      setSuccess(`Mode sélectionné : ${mode.label}`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Cumulus"
        description="Gestion du chauffe-eau"
        icon={BeakerIcon}
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
        <ControlCard
          title="Mode de fonctionnement"
          description="Sélectionnez le mode de fonctionnement du chauffe-eau"
        >
          <div className="space-y-3">
            {modes.map((mode) => (
              <button
                key={mode.value}
                onClick={() => handleModeSelect(mode)}
                disabled={loading !== null}
                className={`
                  w-full p-4 text-left rounded-lg border-2 transition-all
                  ${loading === mode.value 
                    ? 'border-essensys-primary bg-essensys-primary/5' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                  ${loading !== null && loading !== mode.value ? 'opacity-50' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{mode.label}</h4>
                    <p className="text-sm text-gray-500 mt-0.5">{mode.description}</p>
                  </div>
                  {loading === mode.value && (
                    <svg
                      className="animate-spin h-5 w-5 text-essensys-primary"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </ControlCard>

        {/* Info Card */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-1">Conseil économique</h4>
          <p className="text-sm text-blue-700">
            Le mode "Suivi HP/HC" permet de réaliser des économies en chauffant l'eau uniquement 
            pendant les heures creuses de votre contrat d'électricité.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WaterHeaterPage;
