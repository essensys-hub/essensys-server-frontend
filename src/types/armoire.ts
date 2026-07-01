export interface ArmoireHeatingZone {
  consigne: string;
  mode: string;
}

export interface ArmoireSnapshot {
  connected: boolean;
  last_poll_at?: string;
  client_id: string;
  stale_seconds?: number;
  identity: {
    firmware_embedded?: string;
    firmware_web?: string;
    rtc?: string;
    ethernet?: string;
    mac?: string;
  };
  system: {
    heures_creuses: boolean;
    delestage: boolean;
    secouru: boolean;
    comm_faults?: string;
  };
  alarm: {
    mode?: string;
    step?: string;
    armed: boolean;
    triggered: boolean;
    water_leak: boolean;
    detection?: string;
    fraud?: string;
    bp_state?: string;
  };
  comfort: {
    heating?: Record<string, ArmoireHeatingZone>;
    cumulus?: string;
    sprinkler?: string;
    scenario?: string;
  };
  energy: {
    tariff?: string;
    period?: string;
    apparent_power_va?: number;
    wind_speed_kmh?: number;
  };
  raw_missing: number[];
}

export const MOCK_ARMOIRE_SNAPSHOT: ArmoireSnapshot = {
  connected: true,
  last_poll_at: new Date().toISOString(),
  client_id: 'mock-armoire',
  identity: {
    firmware_embedded: '99',
    mac: 'd8:80:39:e1:35:ba',
    ethernet: 'câble OK, serveur joignable',
  },
  system: {
    heures_creuses: true,
    delestage: false,
    secouru: false,
  },
  alarm: {
    mode: 'croisière',
    step: 'croisière',
    armed: true,
    triggered: false,
    water_leak: false,
  },
  comfort: {
    heating: {
      zone_jour: { consigne: 'CONFORT', mode: 'automatique' },
      zone_nuit: { consigne: 'ECO', mode: 'automatique' },
    },
    cumulus: 'gestion HC',
    sprinkler: 'automatique',
    scenario: 'Je sors',
  },
  energy: {
    tariff: 'HC/HP',
    period: 'HC',
    apparent_power_va: 1200,
  },
  raw_missing: [],
};
