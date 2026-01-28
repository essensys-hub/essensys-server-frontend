import React, { useState } from 'react';
import { LightBulbIcon } from '@heroicons/react/24/outline';
import { PageHeader, ControlCard, ActionButton } from '../components/UI';
import { sendInjection } from '../services/legacyApi';

interface Light {
  id: string;
  name: string;
  onIndex: number;
  offIndex: number;
}

const mainLights: Light[] = [
  { id: 'eclp1', name: 'Éclairage 1', onIndex: 200, offIndex: 201 },
  { id: 'eclp2', name: 'Éclairage 2', onIndex: 202, offIndex: 203 },
  { id: 'eclp3', name: 'Éclairage 3', onIndex: 204, offIndex: 205 },
  { id: 'eclp4', name: 'Éclairage 4', onIndex: 206, offIndex: 207 },
  { id: 'eclp5', name: 'Éclairage 5', onIndex: 208, offIndex: 209 },
  { id: 'eclp6', name: 'Éclairage 6', onIndex: 210, offIndex: 211 },
  { id: 'eclp7', name: 'Éclairage 7', onIndex: 212, offIndex: 213 },
  { id: 'eclp8', name: 'Éclairage 8', onIndex: 214, offIndex: 215 },
  { id: 'eclp9', name: 'Éclairage 9', onIndex: 216, offIndex: 217 },
  { id: 'eclp10', name: 'Éclairage 10', onIndex: 218, offIndex: 219 },
];

const indirectLights: Light[] = [
  { id: 'ecli1', name: 'Indirect 1', onIndex: 220, offIndex: 221 },
  { id: 'ecli2', name: 'Indirect 2', onIndex: 222, offIndex: 223 },
  { id: 'ecli3', name: 'Indirect 3', onIndex: 224, offIndex: 225 },
  { id: 'ecli4', name: 'Indirect 4', onIndex: 226, offIndex: 227 },
  { id: 'ecli5', name: 'Indirect 5', onIndex: 228, offIndex: 229 },
  { id: 'ecli6', name: 'Indirect 6', onIndex: 230, offIndex: 231 },
];

export const LightingPage: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLightAction = async (light: Light, action: 'on' | 'off') => {
    const loadingKey = `${light.id}-${action}`;
    setLoading(loadingKey);
    setSuccess(null);

    try {
      const index = action === 'on' ? light.onIndex : light.offIndex;
      await sendInjection(index, '1');
      setSuccess(`${light.name} : ${action === 'on' ? 'Allumé' : 'Éteint'}`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const handleGroupAction = async (lights: Light[], action: 'on' | 'off', groupName: string) => {
    setLoading(`group-${groupName}-${action}`);
    setSuccess(null);

    try {
      for (const light of lights) {
        const index = action === 'on' ? light.onIndex : light.offIndex;
        await sendInjection(index, '1');
      }
      setSuccess(`${groupName} : Tous ${action === 'on' ? 'allumés' : 'éteints'}`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const renderLightControls = (lights: Light[], groupName: string) => (
    <div className="space-y-4">
      {/* Group Actions */}
      <div className="flex gap-2 pb-4 border-b border-gray-100">
        <ActionButton
          label="Tout allumer"
          variant="primary"
          onClick={() => handleGroupAction(lights, 'on', groupName)}
          loading={loading === `group-${groupName}-on`}
          disabled={loading !== null}
          size="sm"
        />
        <ActionButton
          label="Tout éteindre"
          variant="secondary"
          onClick={() => handleGroupAction(lights, 'off', groupName)}
          loading={loading === `group-${groupName}-off`}
          disabled={loading !== null}
          size="sm"
        />
      </div>

      {/* Individual Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {lights.map((light) => (
          <div
            key={light.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <span className="text-sm font-medium text-gray-700">{light.name}</span>
            <div className="flex gap-2">
              <ActionButton
                label="Allumer"
                variant="primary"
                onClick={() => handleLightAction(light, 'on')}
                loading={loading === `${light.id}-on`}
                disabled={loading !== null}
                size="sm"
              />
              <ActionButton
                label="Éteindre"
                variant="secondary"
                onClick={() => handleLightAction(light, 'off')}
                loading={loading === `${light.id}-off`}
                disabled={loading !== null}
                size="sm"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Éclairage"
        description="Contrôle des lumières principales et indirectes"
        icon={LightBulbIcon}
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
        <ControlCard title="Éclairages principaux" description="Lumières principales de la maison">
          {renderLightControls(mainLights, 'Principaux')}
        </ControlCard>

        <ControlCard title="Éclairages indirects" description="Lumières d'ambiance">
          {renderLightControls(indirectLights, 'Indirects')}
        </ControlCard>
      </div>
    </div>
  );
};

export default LightingPage;
