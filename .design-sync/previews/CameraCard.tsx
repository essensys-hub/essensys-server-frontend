import { CameraCard } from 'essensys-web-react';

const camera = {
  id: 'cam-entree',
  name: 'Entrée principale',
  type: 'UVC G4 Bullet',
  model: 'G4 Bullet',
  status: 'CONNECTED',
  last_seen: new Date().toISOString(),
  is_recording: true,
  is_connected: true,
  mac: 'AA:BB:CC:DD:EE:01',
  firmware: '4.69.55',
};

export const Default = () => (
  <div className="max-w-sm">
    <CameraCard camera={camera} showDetails refreshInterval={600000} />
  </div>
);

export const Offline = () => (
  <div className="max-w-sm">
    <CameraCard
      camera={{ ...camera, name: 'Garage', status: 'DISCONNECTED', is_connected: false, is_recording: false }}
      showDetails
      refreshInterval={600000}
    />
  </div>
);
