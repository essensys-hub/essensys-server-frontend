import React, { useState, useEffect } from 'react';
import type { Camera } from '../../services/unifiApi';
import { getCameraSnapshotUrl, isSonnetCamera } from '../../services/unifiApi';
import { VideoCameraIcon } from '@heroicons/react/24/outline';

interface CameraCardProps {
  camera: Camera;
  refreshInterval?: number; // Milliseconds between snapshot refreshes (default: 10000)
  showDetails?: boolean;
  className?: string;
}

export const CameraCard: React.FC<CameraCardProps> = ({
  camera,
  refreshInterval = 10000,
  showDetails = true,
  className = '',
}) => {
  const [snapshotUrl, setSnapshotUrl] = useState<string>(getCameraSnapshotUrl(camera.id));
  const [imageError, setImageError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh snapshot periodically
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(() => {
      setIsRefreshing(true);
      // Add timestamp to force refresh
      setSnapshotUrl(getCameraSnapshotUrl(camera.id));
      // Reset error state on refresh attempt
      setImageError(false);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [camera.id, refreshInterval]);

  const handleImageLoad = () => {
    setIsRefreshing(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsRefreshing(false);
  };

  const isOnline = camera.status === 'online' || camera.is_connected;
  const isSonnet = isSonnetCamera(camera);

  return (
    <div
      className={`
        bg-white rounded-xl border-2 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200
        ${isSonnet ? 'border-essensys-primary' : 'border-gray-200'}
        ${className}
      `}
    >
      {/* Header */}
      {showDetails && (
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 min-w-0">
              <VideoCameraIcon className={`w-5 h-5 mr-2 flex-shrink-0 ${isOnline ? 'text-green-600' : 'text-gray-400'}`} />
              <h3 className="text-sm font-semibold text-gray-900 truncate">{camera.name}</h3>
              {isSonnet && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-essensys-primary text-white rounded">
                  Sonnet
                </span>
              )}
            </div>
            <div className={`ml-2 w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
          </div>
          {showDetails && (
            <div className="mt-1 text-xs text-gray-500">
              {camera.model} • {isOnline ? 'En ligne' : 'Hors ligne'}
            </div>
          )}
        </div>
      )}

      {/* Snapshot */}
      <div className="relative bg-gray-100 aspect-video">
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <div className="text-center">
              <VideoCameraIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Image indisponible</p>
            </div>
          </div>
        ) : (
          <>
            <img
              src={snapshotUrl}
              alt={camera.name}
              className={`w-full h-full object-cover ${isRefreshing ? 'opacity-50' : 'opacity-100'} transition-opacity duration-300`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            {isRefreshing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer with status */}
      {showDetails && (
        <div className="p-2 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">
              {camera.is_recording && (
                <span className="inline-flex items-center">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1 animate-pulse" />
                  Enregistrement
                </span>
              )}
            </span>
            {camera.last_seen && (
              <span className="text-gray-400">
                {new Date(camera.last_seen).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraCard;
