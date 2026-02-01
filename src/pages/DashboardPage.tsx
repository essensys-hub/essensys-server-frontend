import React, { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  FireIcon,
  LightBulbIcon,
  ViewColumnsIcon,
  BeakerIcon,
  CloudIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { CardSummary } from '../components/UI';
import { CameraCard } from '../components/UniFi';
import { useLastAction } from '../hooks';
import type { Camera } from '../services/unifiApi';
import { getCameras, isSonnetCamera } from '../services/unifiApi';

// Helper to format action details from backend response
const formatActionInfo = (actionType: string, actionInfo: string): string => {
  if (actionInfo) return actionInfo;
  if (actionType === 'LEGACY') return 'Commande envoyée';
  return actionType;
};

export const DashboardPage: React.FC = () => {
  const { lastAction, loading, error, refetch } = useLastAction();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [camerasLoading, setCamerasLoading] = useState(false);

  // Parse last action info - for now, we just show the last action from the backend
  // In the future, this could be expanded to track per-category actions
  const lastActionDate = lastAction?.timestamp ? new Date(lastAction.timestamp) : undefined;
  const lastActionText = lastAction 
    ? formatActionInfo(lastAction.actionType, lastAction.actionInfo)
    : undefined;

  // Fetch cameras on mount
  useEffect(() => {
    const fetchCameras = async () => {
      try {
        setCamerasLoading(true);
        const camerasList = await getCameras();
        setCameras(camerasList);
      } catch (e) {
        console.error('Failed to fetch cameras:', e);
        // Don't show error on dashboard, just log it
      } finally {
        setCamerasLoading(false);
      }
    };

    fetchCameras();
  }, []);

  // Get main cameras to display (Sonnet first, then first 3 others)
  const sonnetCameras = cameras.filter(isSonnetCamera);
  const otherCameras = cameras.filter((c) => !isSonnetCamera(c)).slice(0, 3);
  const mainCameras = [...sonnetCameras, ...otherCameras].slice(0, 4);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-gray-500">
          Bienvenue sur Mon Essensys. Gérez votre domotique depuis cette interface.
        </p>
      </div>

      {/* Last Action Info */}
      {lastAction && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-800">
                <strong>Dernière action :</strong> {lastActionText}
                {lastActionDate && (
                  <span className="ml-2 text-green-600">
                    ({lastActionDate.toLocaleString('fr-FR')})
                  </span>
                )}
              </p>
              <p className="text-xs text-green-600 mt-1">
                GUID: {lastAction.guid} • {lastAction.isDone ? 'Exécutée' : 'En attente'}
              </p>
            </div>
            <button
              onClick={refetch}
              disabled={loading}
              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
              title="Rafraîchir"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Alert Banner */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Rappel :</strong> Le système fonctionne en boucle ouverte. 
          Les états affichés correspondent à la dernière commande envoyée, pas à l'état réel des équipements.
        </p>
      </div>

      {/* Cameras Section */}
      {mainCameras.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Caméras</h2>
              <p className="text-sm text-gray-500">Vue en direct des caméras principales</p>
            </div>
            <a
              href="/unifi-protect"
              className="text-sm text-essensys-primary hover:text-essensys-primary-dark font-medium"
            >
              Voir toutes →
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mainCameras.map((camera) => (
              <CameraCard
                key={camera.id}
                camera={camera}
                refreshInterval={15000}
                showDetails={false}
                className="cursor-pointer hover:shadow-lg transition-shadow"
              />
            ))}
          </div>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <CardSummary
          title="UniFi Protect"
          description="Caméras de surveillance"
          icon={VideoCameraIcon}
          linkTo="/unifi-protect"
          status={camerasLoading ? 'pending' : cameras.length > 0 ? 'idle' : 'error'}
        />

        <CardSummary
          title="Sécurité"
          description="Alarme et protection"
          icon={ShieldCheckIcon}
          linkTo="/security"
          status={loading ? 'pending' : 'idle'}
        />

        <CardSummary
          title="Chauffage"
          description="Zones et températures"
          icon={FireIcon}
          linkTo="/heating"
          status={loading ? 'pending' : 'idle'}
        />

        <CardSummary
          title="Éclairage"
          description="Lumières principales et indirectes"
          icon={LightBulbIcon}
          linkTo="/lighting"
          status={loading ? 'pending' : 'idle'}
        />

        <CardSummary
          title="Volets & Stores"
          description="Ouverture et fermeture"
          icon={ViewColumnsIcon}
          linkTo="/shutters"
          status={loading ? 'pending' : 'idle'}
        />

        <CardSummary
          title="Cumulus"
          description="Chauffe-eau"
          icon={BeakerIcon}
          linkTo="/water-heater"
          status={loading ? 'pending' : 'idle'}
        />

        <CardSummary
          title="Arrosage"
          description="Programmation jardin"
          icon={CloudIcon}
          linkTo="/sprinkler"
          status={loading ? 'pending' : 'idle'}
        />

        <CardSummary
          title="Notifications"
          description="SMS et emails"
          icon={BellIcon}
          linkTo="/notifications"
          status="idle"
        />

        <CardSummary
          title="Paramètres"
          description="Configuration système"
          icon={Cog6ToothIcon}
          linkTo="/settings"
          status="idle"
        />
      </div>
    </div>
  );
};

export default DashboardPage;
