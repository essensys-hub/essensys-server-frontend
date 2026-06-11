import React, { useEffect, useState } from 'react';
import { ViewColumnsIcon } from '@heroicons/react/24/outline';
import { PageHeader, ControlCard, ActionButton } from '../components/UI';
import { sendInjection, getExchangeValues } from '../services/legacyApi';

interface Shutter {
  id: string;
  name: string;
  dvalue: string;
  openIndex: number;
  closeIndex: number;
  // Indice table d'échange du temps de course (Volets_*_Temps, 566-589)
  // 1-255 secondes, 0 = défaut firmware (120 s volet, 255 s store)
  timeIndex: number;
}

// Utilise les mêmes données que ShutterControl.tsx (V.1.0.0)
const shutters: Shutter[] = [
  { id: 'volet1salon', name: 'Volet 1 Salon', dvalue: '1', openIndex: 617, closeIndex: 620, timeIndex: 566 },
  { id: 'volet2salon', name: 'Volet 2 Salon', dvalue: '2', openIndex: 617, closeIndex: 620, timeIndex: 567 },
  { id: 'volet3salon', name: 'Volet 3 Salon', dvalue: '4', openIndex: 617, closeIndex: 620, timeIndex: 568 },
  { id: 'volet1salleamanger', name: 'Volet 1 Salle à Manger', dvalue: '8', openIndex: 617, closeIndex: 620, timeIndex: 569 },
  { id: 'volet2salleamanger', name: 'Volet 2 Salle à Manger', dvalue: '16', openIndex: 617, closeIndex: 620, timeIndex: 570 },
  { id: 'volet1cuisine', name: 'Volet 1 Cuisine', dvalue: '1', openIndex: 619, closeIndex: 622, timeIndex: 582 },
  { id: 'volet2cuisine', name: 'Volet 2 Cuisine', dvalue: '2', openIndex: 619, closeIndex: 622, timeIndex: 583 },
  { id: 'voletsdb', name: 'Volet Salle de Bain 1', dvalue: '4', openIndex: 619, closeIndex: 622, timeIndex: 584 },
  { id: 'volet1gdchamb', name: 'Volet 1 Grande Chambre', dvalue: '1', openIndex: 618, closeIndex: 621, timeIndex: 574 },
  { id: 'volet2gdchamb', name: 'Volet 2 Grande Chambre', dvalue: '2', openIndex: 618, closeIndex: 621, timeIndex: 575 },
  { id: 'volet1ptchamb', name: 'Volet Petite Chambre 1', dvalue: '4', openIndex: 618, closeIndex: 621, timeIndex: 576 },
  { id: 'volet2ptchamb', name: 'Volet Petite Chambre 2', dvalue: '8', openIndex: 618, closeIndex: 621, timeIndex: 577 },
  { id: 'volet3ptchamb', name: 'Volet Petite Chambre 3', dvalue: '16', openIndex: 618, closeIndex: 621, timeIndex: 578 },
  { id: 'voletbureau', name: 'Volet Bureau', dvalue: '32', openIndex: 617, closeIndex: 620, timeIndex: 571 },
];

const stores: Shutter[] = [
  { id: 'voletstore', name: 'Volet "Store"', dvalue: '64', openIndex: 617, closeIndex: 620, timeIndex: 572 },
  { id: 'store', name: 'Store (banne)', dvalue: '8', openIndex: 619, closeIndex: 622, timeIndex: 585 },
];

const allShutters = [...shutters, ...stores];

export const ShuttersPage: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Temps de course : valeurs connues du firmware (indice -> secondes) et saisies en cours
  const [knownTimes, setKnownTimes] = useState<Record<number, string>>({});
  const [editedTimes, setEditedTimes] = useState<Record<number, string>>({});
  const [timesLoaded, setTimesLoaded] = useState(false);

  useEffect(() => {
    const loadTimes = async () => {
      try {
        const values = await getExchangeValues(allShutters.map((s) => s.timeIndex));
        setKnownTimes(values);
      } catch (e) {
        console.error('[TEMPS VOLETS] Lecture impossible:', e);
      } finally {
        setTimesLoaded(true);
      }
    };
    loadTimes();
  }, []);

  const handleSaveTime = async (shutter: Shutter) => {
    const raw = editedTimes[shutter.timeIndex];
    const seconds = parseInt(raw, 10);
    if (isNaN(seconds) || seconds < 1 || seconds > 255) {
      setSuccess(null);
      console.error(`[TEMPS VOLETS] Valeur invalide pour ${shutter.name}: ${raw} (1-255 attendu)`);
      return;
    }

    setLoading(`time-${shutter.id}`);
    setSuccess(null);
    try {
      await sendInjection(shutter.timeIndex, String(seconds));
      setKnownTimes((prev) => ({ ...prev, [shutter.timeIndex]: String(seconds) }));
      setEditedTimes((prev) => {
        const next = { ...prev };
        delete next[shutter.timeIndex];
        return next;
      });
      setSuccess(`${shutter.name} : temps de course réglé à ${seconds} s`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

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

  const renderTimeSettings = () => (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Durée de maintien de la commande du moteur, identique à l'ouverture et à la fermeture
        (1 à 255 secondes). La valeur affichée est la dernière remontée par la carte — si elle
        est vide, le firmware ne l'a pas encore communiquée (défaut usine : 120 s, store : 255 s).
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {allShutters.map((item) => {
          const known = knownTimes[item.timeIndex];
          const edited = editedTimes[item.timeIndex];
          return (
            <div
              key={`time-${item.id}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg gap-2"
            >
              <div className="min-w-0">
                <span className="block text-sm font-medium text-gray-700 truncate">{item.name}</span>
                <span className="block text-xs text-gray-400">
                  {timesLoaded
                    ? known !== undefined
                      ? `Actuel : ${known} s`
                      : 'Actuel : inconnu'
                    : 'Chargement…'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={255}
                  placeholder={known ?? '—'}
                  value={edited ?? ''}
                  onChange={(e) =>
                    setEditedTimes((prev) => ({ ...prev, [item.timeIndex]: e.target.value }))
                  }
                  className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <ActionButton
                  label="OK"
                  variant="primary"
                  onClick={() => handleSaveTime(item)}
                  loading={loading === `time-${item.id}`}
                  disabled={loading !== null || !edited}
                  size="sm"
                />
              </div>
            </div>
          );
        })}
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

        <ControlCard
          title="Temps de course"
          description="Réglage du temps d'ouverture/fermeture de chaque volet (en secondes)"
        >
          {renderTimeSettings()}
        </ControlCard>
      </div>
    </div>
  );
};

export default ShuttersPage;
