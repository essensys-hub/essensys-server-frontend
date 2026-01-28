import React, { useState } from 'react';
import { CloudIcon } from '@heroicons/react/24/outline';
import { PageHeader, ControlCard } from '../components/UI';
import { sendInjection } from '../services/legacyApi';

interface SprinklerMode {
  value: string;
  label: string;
  description: string;
  dindex: number;
}

const modes: SprinklerMode[] = [
  { 
    value: 'auto', 
    label: 'Automatique', 
    description: 'Suit le planning programmé',
    dindex: 500 
  },
  { 
    value: '15min', 
    label: '15 minutes', 
    description: 'Arrosage manuel de 15 minutes',
    dindex: 501 
  },
  { 
    value: '30min', 
    label: '30 minutes', 
    description: 'Arrosage manuel de 30 minutes',
    dindex: 502 
  },
  { 
    value: '60min', 
    label: '60 minutes', 
    description: 'Arrosage manuel de 60 minutes',
    dindex: 503 
  },
  { 
    value: 'off', 
    label: 'OFF', 
    description: 'Arrêt complet de l\'arrosage',
    dindex: 504 
  },
];

export const SprinklerPage: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleModeSelect = async (mode: SprinklerMode) => {
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
        title="Arrosage"
        description="Gestion de l'arrosage automatique du jardin"
        icon={CloudIcon}
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
          title="Mode d'arrosage"
          description="Sélectionnez le mode d'arrosage souhaité"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {modes.map((mode) => (
              <button
                key={mode.value}
                onClick={() => handleModeSelect(mode)}
                disabled={loading !== null}
                className={`
                  p-4 text-left rounded-lg border-2 transition-all
                  ${loading === mode.value 
                    ? 'border-essensys-primary bg-essensys-primary/5' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                  ${loading !== null && loading !== mode.value ? 'opacity-50' : ''}
                  ${mode.value === 'off' ? 'sm:col-span-2' : ''}
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

        {/* Weather Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-1">Conseil</h4>
          <p className="text-sm text-blue-700">
            Les modes manuels (15, 30, 60 min) permettent de lancer un arrosage ponctuel 
            indépendamment de la programmation automatique.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SprinklerPage;
