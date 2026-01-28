import React, { useState } from 'react';
import { ViewColumnsIcon } from '@heroicons/react/24/outline';
import { PageHeader, ControlCard, ActionButton } from '../components/UI';
import { sendInjection } from '../services/legacyApi';

interface Shutter {
  id: string;
  name: string;
  openIndex: number;
  closeIndex: number;
}

const shutters: Shutter[] = [
  { id: 'volet1', name: 'Volet 1', openIndex: 300, closeIndex: 301 },
  { id: 'volet2', name: 'Volet 2', openIndex: 302, closeIndex: 303 },
  { id: 'volet3', name: 'Volet 3', openIndex: 304, closeIndex: 305 },
  { id: 'volet4', name: 'Volet 4', openIndex: 306, closeIndex: 307 },
  { id: 'volet5', name: 'Volet 5', openIndex: 308, closeIndex: 309 },
  { id: 'volet6', name: 'Volet 6', openIndex: 310, closeIndex: 311 },
  { id: 'volet7', name: 'Volet 7', openIndex: 312, closeIndex: 313 },
  { id: 'volet8', name: 'Volet 8', openIndex: 314, closeIndex: 315 },
  { id: 'volet9', name: 'Volet 9', openIndex: 316, closeIndex: 317 },
  { id: 'volet10', name: 'Volet 10', openIndex: 318, closeIndex: 319 },
  { id: 'volet11', name: 'Volet 11', openIndex: 320, closeIndex: 321 },
  { id: 'volet12', name: 'Volet 12', openIndex: 322, closeIndex: 323 },
  { id: 'volet13', name: 'Volet 13', openIndex: 324, closeIndex: 325 },
];

const stores: Shutter[] = [
  { id: 'store', name: 'Store', openIndex: 330, closeIndex: 331 },
  { id: 'voletstore', name: 'Volet Store', openIndex: 332, closeIndex: 333 },
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
      await sendInjection(index, '1');
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
        await sendInjection(index, '1');
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

        <ControlCard title="Stores" description="Stores extérieurs">
          {renderShutterControls(stores, 'Stores')}
        </ControlCard>
      </div>
    </div>
  );
};

export default ShuttersPage;
