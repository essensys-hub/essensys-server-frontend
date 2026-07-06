import { CardSummary } from 'essensys-web-react';
import {
  FireIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';

const minutesAgo = (m: number) => new Date(Date.now() - m * 60 * 1000);

export const Default = () => (
  <div className="grid max-w-md gap-4">
    <CardSummary
      title="Chauffage"
      description="Thermostats & planning"
      icon={FireIcon}
      lastAction="Consigne réglée à 21°C"
      lastActionDate={minutesAgo(8)}
      linkTo="/heating"
    />
  </div>
);

export const Statuses = () => (
  <div className="grid max-w-md gap-4">
    <CardSummary
      title="Éclairage"
      icon={LightBulbIcon}
      status="idle"
      lastAction="Salon éteint"
      lastActionDate={minutesAgo(45)}
      linkTo="/lighting"
    />
    <CardSummary
      title="Alarme"
      icon={ShieldCheckIcon}
      status="pending"
      lastAction="Armement en cours…"
      lastActionDate={minutesAgo(1)}
      linkTo="/alarm"
    />
    <CardSummary
      title="Caméras"
      icon={VideoCameraIcon}
      status="error"
      description="Flux UniFi indisponible"
      linkTo="/cameras"
    />
  </div>
);

export const External = () => (
  <div className="grid max-w-md gap-4">
    <CardSummary
      title="Console UniFi"
      description="Ouvre l'interface réseau"
      icon={VideoCameraIcon}
      externalLink="https://unifi.example.com"
    />
  </div>
);
