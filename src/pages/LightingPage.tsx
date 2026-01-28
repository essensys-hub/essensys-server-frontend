import React, { useState } from 'react';
import { LightBulbIcon } from '@heroicons/react/24/outline';
import { PageHeader, ControlCard, ActionButton } from '../components/UI';
import { sendInjection } from '../services/legacyApi';

interface Light {
  id: string;
  name: string;
  dvalue: string;
  onIndex: number;
  offIndex: number;
}

// Utilise les mêmes données que LightingControl.tsx (V.1.0.0)
const mainLights: Light[] = [
  { id: 'terrasse', name: 'Terrasse', dvalue: '4', onIndex: 616, offIndex: 610 },
  { id: 'entree', name: 'Entrée', dvalue: '1', onIndex: 611, offIndex: 605 },
  { id: 'escalier', name: 'Escalier', dvalue: '1', onIndex: 613, offIndex: 607 },
  { id: 'deg1', name: 'Dégagement 1', dvalue: '1', onIndex: 616, offIndex: 610 },
  { id: 'deg2', name: 'Dégagement 2', dvalue: '2', onIndex: 616, offIndex: 610 },
  { id: 'pieceserv', name: 'Pièce de service', dvalue: '128', onIndex: 615, offIndex: 609 },
  { id: 'ann1', name: 'Annexe 1', dvalue: '8', onIndex: 616, offIndex: 610 },
  { id: 'ann2', name: 'Annexe 2', dvalue: '16', onIndex: 616, offIndex: 610 },
  { id: 'salon', name: 'Salon', dvalue: '128', onIndex: 612, offIndex: 606 },
  { id: 'sam', name: 'Salle à Manger', dvalue: '64', onIndex: 612, offIndex: 606 },
  { id: 'cuisine', name: 'Cuisine', dvalue: '1', onIndex: 615, offIndex: 609 },
  { id: 'sdb1', name: 'Salle de Bain 1', dvalue: '128', onIndex: 616, offIndex: 610 },
  { id: 'sdb2', name: 'Salle de Bain 2', dvalue: '8', onIndex: 615, offIndex: 609 },
  { id: 'wc1', name: 'WC 1', dvalue: '32', onIndex: 615, offIndex: 609 },
  { id: 'wc2', name: 'WC 2', dvalue: '64', onIndex: 615, offIndex: 609 },
  { id: 'bureau', name: 'Bureau', dvalue: '32', onIndex: 612, offIndex: 606 },
  { id: 'gdchamb', name: 'Grande Chambre', dvalue: '128', onIndex: 614, offIndex: 608 },
  { id: 'ptchamb1', name: 'Petite Chambre 1', dvalue: '64', onIndex: 614, offIndex: 608 },
  { id: 'ptchamb2', name: 'Petite Chambre 2', dvalue: '32', onIndex: 614, offIndex: 608 },
  { id: 'ptchamb3', name: 'Petite Chambre 3', dvalue: '16', onIndex: 614, offIndex: 608 },
  { id: 'dressing', name: 'Dressing', dvalue: '8', onIndex: 611, offIndex: 605 },
];

const indirectLights: Light[] = [
  { id: 'isalonind', name: 'Salon (indirect 1)', dvalue: '2', onIndex: 611, offIndex: 605 },
  { id: 'isalonind2', name: 'Salon (indirect 2)', dvalue: '4', onIndex: 611, offIndex: 605 },
  { id: 'icuisine', name: 'Cuisine (plans de travail)', dvalue: '2', onIndex: 615, offIndex: 609 },
  { id: 'isdb1', name: 'Salle de Bain 1 (miroir)', dvalue: '4', onIndex: 615, offIndex: 609 },
  { id: 'isdb2', name: 'Salle de Bain 2 (miroir)', dvalue: '16', onIndex: 615, offIndex: 609 },
  { id: 'igdchamb1', name: 'Grande Chambre (chevet 1)', dvalue: '2', onIndex: 613, offIndex: 607 },
  { id: 'igdchamb2', name: 'Grande Chambre (chevet 2)', dvalue: '4', onIndex: 613, offIndex: 607 },
  { id: 'iptchamb1', name: 'Petite Chambre 1 (chevet 1)', dvalue: '8', onIndex: 613, offIndex: 607 },
  { id: 'iptchamb2', name: 'Petite Chambre 1 (chevet 2)', dvalue: '16', onIndex: 613, offIndex: 607 },
  { id: 'iptchamb22', name: 'Petite Chambre 2 (chevet)', dvalue: '32', onIndex: 613, offIndex: 607 },
  { id: 'iptchamb3', name: 'Petite Chambre 3 (chevet)', dvalue: '64', onIndex: 613, offIndex: 607 },
  { id: 'idressing', name: 'Dressing (placards)', dvalue: '16', onIndex: 611, offIndex: 605 },
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
      await sendInjection(index, light.dvalue);
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
        await sendInjection(index, light.dvalue);
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
