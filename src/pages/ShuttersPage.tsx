import React, { useState } from 'react';
import { ViewColumnsIcon } from '@heroicons/react/24/outline';
import { PageHeader, ControlCard, ActionButton } from '../components/UI';
import { sendInjection } from '../services/legacyApi';

interface Shutter {
  id: string;
  name: string;
  dvalue: string;
  openIndex: number;
  closeIndex: number;
}

// Utilise les mêmes données que ShutterControl.tsx (V.1.0.0)
const shutters: Shutter[] = [
  { id: 'volet1salon', name: 'Volet 1 Salon', dvalue: '1', openIndex: 617, closeIndex: 620 },
  { id: 'volet2salon', name: 'Volet 2 Salon', dvalue: '2', openIndex: 617, closeIndex: 620 },
  { id: 'volet3salon', name: 'Volet 3 Salon', dvalue: '4', openIndex: 617, closeIndex: 620 },
  { id: 'volet1salleamanger', name: 'Volet 1 Salle à Manger', dvalue: '8', openIndex: 617, closeIndex: 620 },
  { id: 'volet2salleamanger', name: 'Volet 2 Salle à Manger', dvalue: '16', openIndex: 617, closeIndex: 620 },
  { id: 'volet1cuisine', name: 'Volet 1 Cuisine', dvalue: '1', openIndex: 619, closeIndex: 622 },
  { id: 'volet2cuisine', name: 'Volet 2 Cuisine', dvalue: '2', openIndex: 619, closeIndex: 622 },
  { id: 'voletsdb', name: 'Volet Salle de Bain 1', dvalue: '4', openIndex: 619, closeIndex: 622 },
  { id: 'volet1gdchamb', name: 'Volet 1 Grande Chambre', dvalue: '1', openIndex: 618, closeIndex: 621 },
  { id: 'volet2gdchamb', name: 'Volet 2 Grande Chambre', dvalue: '2', openIndex: 618, closeIndex: 621 },
  { id: 'volet1ptchamb', name: 'Volet Petite Chambre 1', dvalue: '4', openIndex: 618, closeIndex: 621 },
  { id: 'volet2ptchamb', name: 'Volet Petite Chambre 2', dvalue: '8', openIndex: 618, closeIndex: 621 },
  { id: 'volet3ptchamb', name: 'Volet Petite Chambre 3', dvalue: '16', openIndex: 618, closeIndex: 621 },
  { id: 'voletbureau', name: 'Volet Bureau', dvalue: '32', openIndex: 617, closeIndex: 620 },
];

const stores: Shutter[] = [
  { id: 'voletstore', name: 'Volet "Store"', dvalue: '64', openIndex: 617, closeIndex: 620 },
  { id: 'store', name: 'Store (banne)', dvalue: '8', openIndex: 619, closeIndex: 622 },
];

export const ShuttersPage: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleShutterAction = async (shutter: Shutter, action: 'open' | 'close') => {
    const loadingKey = `${shutter.id}-${action}`;
    setLoading(loadingKey);
    setSuccess(null);

    try {
      const index = action === 'open' ? shutter.openIndex : shutter.closeIndex;
      await sendInjection(index, shutter.dvalue);
      setSuccess(`${shutter.name} : ${action === 'open' ? 'Ouvert' : 'Fermé'}`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const handleGroupAction = async (items: Shutter[], action: 'open' | 'close', groupName: string) => {
    setLoading(`group-${groupName}-${action}`);
    setSuccess(null);

    try {
      for (const item of items) {
        const index = action === 'open' ? item.openIndex : item.closeIndex;
        await sendInjection(index, item.dvalue);
      }
      setSuccess(`${groupName} : Tous ${action === 'open' ? 'ouverts' : 'fermés'}`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const renderShutterControls = (items: Shutter[], groupName: string) => (
    <div className="space-y-4">
      {/* Group Actions */}
      <div className="flex gap-2 pb-4 border-b border-gray-100">
        <ActionButton
          label="Tout ouvrir"
          variant="primary"
          onClick={() => handleGroupAction(items, 'open', groupName)}
          loading={loading === `group-${groupName}-open`}
          disabled={loading !== null}
          size="sm"
        />
        <ActionButton
          label="Tout fermer"
          variant="secondary"
          onClick={() => handleGroupAction(items, 'close', groupName)}
          loading={loading === `group-${groupName}-close`}
          disabled={loading !== null}
          size="sm"
        />
      </div>

      {/* Individual Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <span className="text-sm font-medium text-gray-700">{item.name}</span>
            <div className="flex gap-2">
              <ActionButton
                label="Ouvrir"
                variant="primary"
                onClick={() => handleShutterAction(item, 'open')}
                loading={loading === `${item.id}-open`}
                disabled={loading !== null}
                size="sm"
              />
              <ActionButton
                label="Fermer"
                variant="secondary"
                onClick={() => handleShutterAction(item, 'close')}
                loading={loading === `${item.id}-close`}
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
        title="Volets & Stores"
        description="Contrôle des volets roulants et des stores"
        icon={ViewColumnsIcon}
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
        <ControlCard title="Volets" description="Volets roulants">
          {renderShutterControls(shutters, 'Volets')}
        </ControlCard>

        <ControlCard title="Volet Store et Store banne" description="Éléments spéciaux">
          {renderShutterControls(stores, 'Stores')}
        </ControlCard>
      </div>
    </div>
  );
};

export default ShuttersPage;
