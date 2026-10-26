/**
 * Prises de sécurité (security-outlets-2026-10-011).
 *
 * Commande : Scenario_Securite du scénario 1 (indice 623 = 592 + 31), déclenché par 590 = 1.
 * État : Securite_PriseCoupe (indice 440), 1 = prises coupées, 0 = pilotées.
 * Les couples envoyés sont verrouillés par NR-portal-frontend-8 (cloud) et NR-server-frontend-6 (local).
 */
export const SECURITY_OUTLETS_STATE_INDEX = 440;
export const SECURITY_OUTLETS_COMMAND_INDEX = 623;
/** Décalage de Scenario_Securite dans le bloc d'un scénario (592 + (n − 1) × 41). */
export const SCENARIO_SECURITY_OFFSET = 31;

export type SecurityOutletsAction = 'cut' | 'restore';
export type SecurityOutletsState = 'cut' | 'piloted' | 'unknown';

export const securityOutletsBatch = (action: SecurityOutletsAction): Array<{ k: number; v: string }> => [
  { k: 590, v: '1' },
  { k: SECURITY_OUTLETS_COMMAND_INDEX, v: action === 'cut' ? '1' : '2' },
];

export const securityOutletsState = (value: string | undefined): SecurityOutletsState => {
  switch (value?.trim()) {
    case '1':
      return 'cut';
    case '0':
      return 'piloted';
    default:
      return 'unknown';
  }
};

export const securityOutletsLabel: Record<SecurityOutletsState, string> = {
  cut: 'Prises coupées',
  piloted: 'Prises pilotées',
  unknown: 'État inconnu',
};

export const expectedStateAfter = (action: SecurityOutletsAction): SecurityOutletsState =>
  action === 'cut' ? 'cut' : 'piloted';

export const scenarioSecurityIndex = (baseIndex: number): number => baseIndex + SCENARIO_SECURITY_OFFSET;

export const scenarioSecurityChoices: Array<{ value: string; label: string }> = [
  { value: '0', label: 'Ne rien faire' },
  { value: '1', label: 'Couper' },
  { value: '2', label: 'Rétablir' },
];
