import React, { useState, useEffect } from 'react';
import { VideoCameraIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '../components/UI';
import { CameraCard } from '../components/UniFi';
import type { Camera } from '../services/unifiApi';
import { getCameras, isSonnetCamera } from '../services/unifiApi';

export const UniFiProtectPage: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'sonnet' | 'online'>('all');

  const fetchCameras = async () => {
    try {
      setLoading(true);
      setError(null);
      const camerasList = await getCameras();
      setCameras(camerasList);
    } catch (e) {
      console.error('Failed to fetch cameras:', e);
      setError(e instanceof Error ? e.message : 'Erreur lors de la récupération des caméras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCameras();
    // Refresh cameras list every 30 seconds
    const interval = setInterval(fetchCameras, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredCameras = cameras.filter((camera) => {
    if (filter === 'sonnet') {
      return isSonnetCamera(camera);
    }
    if (filter === 'online') {
      return camera.status === 'online' || camera.is_connected;
    }
    return true;
  });

  // Separate Sonnet cameras from others
  const sonnetCameras = cameras.filter(isSonnetCamera);
  const otherCameras = cameras.filter((c) => !isSonnetCamera(c));

  return (
    <div>
      <PageHeader
        title="UniFi Protect"
        description="Vue d'ensemble des caméras de surveillance"
        icon={VideoCameraIcon}
        backLink="/dashboard"
        backLabel="Tableau de bord"
      />

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-essensys-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Toutes ({cameras.length})
        </button>
        <button
          onClick={() => setFilter('sonnet')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'sonnet'
              ? 'bg-essensys-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Sonnet ({sonnetCameras.length})
        </button>
        <button
          onClick={() => setFilter('online')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'online'
              ? 'bg-essensys-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          En ligne ({cameras.filter((c) => c.status === 'online' || c.is_connected).length})
        </button>
      </div>

      {/* Loading State */}
      {loading && cameras.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-essensys-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Chargement des caméras...</p>
        </div>
      )}

      {/* Cameras Grid */}
      {!loading && filteredCameras.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCameras.map((camera) => (
            <CameraCard
              key={camera.id}
              camera={camera}
              refreshInterval={10000}
              showDetails={true}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredCameras.length === 0 && (
        <div className="text-center py-12">
          <VideoCameraIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {filter === 'all'
              ? 'Aucune caméra trouvée'
              : filter === 'sonnet'
              ? 'Aucune caméra Sonnet trouvée'
              : 'Aucune caméra en ligne'}
          </p>
        </div>
      )}

      {/* Sonnet Cameras Section (if filter is 'all') */}
      {filter === 'all' && sonnetCameras.length > 0 && otherCameras.length > 0 && (
        <>
          <div className="mt-8 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Caméras Sonnet</h2>
            <p className="text-sm text-gray-500">Caméras principales</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {sonnetCameras.map((camera) => (
              <CameraCard
                key={camera.id}
                camera={camera}
                refreshInterval={10000}
                showDetails={true}
              />
            ))}
          </div>

          <div className="mt-8 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Autres caméras</h2>
            <p className="text-sm text-gray-500">Caméras supplémentaires</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {otherCameras.map((camera) => (
              <CameraCard
                key={camera.id}
                camera={camera}
                refreshInterval={10000}
                showDetails={true}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default UniFiProtectPage;
