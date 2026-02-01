/**
 * UniFi Protect API Service
 * Communicates with backend proxy to access UniFi Protect cameras
 */

const getBackendUrl = (): string => {
  const backendUrl = localStorage.getItem('backend_url') || 'http://localhost:7070';
  return backendUrl;
};

export interface Camera {
  id: string;
  name: string;
  type: string;
  model: string;
  status: string;
  last_seen: string;
  is_recording: boolean;
  is_connected: boolean;
  mac: string;
  firmware: string;
}

export interface CamerasResponse {
  cameras: Camera[];
}

/**
 * Get list of all cameras from UniFi Protect
 */
export const getCameras = async (): Promise<Camera[]> => {
  const backendUrl = getBackendUrl();
  const apiUrl = `${backendUrl}/api/unifi/cameras`;

  console.log(`[UNIFI] Fetching cameras from: ${apiUrl}`);

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch cameras: ${response.status} - ${errorText}`);
  }

  const data: CamerasResponse = await response.json();
  console.log(`[UNIFI] Retrieved ${data.cameras.length} cameras`);
  return data.cameras;
};

/**
 * Get snapshot image URL for a camera
 * Returns a blob URL that can be used as src for img tag
 */
export const getCameraSnapshotUrl = (cameraId: string): string => {
  const backendUrl = getBackendUrl();
  return `${backendUrl}/api/unifi/cameras/${cameraId}/snapshot?t=${Date.now()}`;
};

/**
 * Get snapshot image as blob
 */
export const getCameraSnapshot = async (cameraId: string): Promise<Blob> => {
  const backendUrl = getBackendUrl();
  const apiUrl = `${backendUrl}/api/unifi/cameras/${cameraId}/snapshot?t=${Date.now()}`;

  const response = await fetch(apiUrl, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch snapshot for camera ${cameraId}: ${response.status}`);
  }

  return await response.blob();
};

/**
 * Check if a camera name contains "sonnet" (case insensitive)
 */
export const isSonnetCamera = (camera: Camera): boolean => {
  return camera.name.toLowerCase().includes('sonnet') || 
         camera.model.toLowerCase().includes('sonnet');
};
