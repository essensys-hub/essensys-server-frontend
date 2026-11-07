/**
 * Noms personnalisés des lumières (noms-lumieres-2026-11-004).
 *
 * Contrat (portail local) : GET /api/lights/names, PUT /api/admin/lights/names/{id} body {"name": "WC 3"}
 * ou {"name": null} (retour au nom d'origine). Le nom est affiché en texte brut (jamais en HTML).
 * Verrouillé par NR-server-frontend-8.
 */
export interface LightNameValue {
  id: string;
  /** Nom d'origine. */
  default: string;
  /** Nom personnalisé, null si aucun. */
  name: string | null;
  version: number;
  updated_at: string | null;
}

export type LightNameWriteStatus = 'saved' | 'dry_run';

export const MIN_NAME_LENGTH = 1;
export const MAX_NAME_LENGTH = 40;

/** Catalogue (ordre d'affichage) : id commun aux clients et nom d'origine. */
export const LIGHT_NAME_CATALOG: ReadonlyArray<readonly [string, string]> = [
  ['terrasse', 'Terrasse'], ['entree', 'Entrée'], ['escalier', 'Escalier'], ['deg1', 'Dégagement 1'],
  ['deg2', 'Dégagement 2'], ['pieceserv', 'Pièce de service'], ['ann1', 'Annexe 1'], ['ann2', 'Annexe 2'],
  ['salon', 'Salon'], ['sam', 'Salle à Manger'], ['cuisine', 'Cuisine'], ['sdb1', 'Salle de Bain 1'],
  ['sdb2', 'Salle de Bain 2'], ['wc1', 'WC 1'], ['wc2', 'WC 2'], ['bureau', 'Bureau'],
  ['gdchamb', 'Grande Chambre'], ['ptchamb1', 'Petite Chambre 1'], ['ptchamb2', 'Petite Chambre 2'],
  ['ptchamb3', 'Petite Chambre 3'], ['dressing', 'Dressing'],
  ['isalonind', 'Salon (indirect 1)'], ['isalonind2', 'Salon (indirect 2)'], ['icuisine', 'Cuisine (plans de travail)'],
  ['isdb1', 'Salle de Bain 1 (miroir)'], ['isdb2', 'Salle de Bain 2 (miroir)'], ['igdchamb1', 'Grande Chambre (chevet 1)'],
  ['igdchamb2', 'Grande Chambre (chevet 2)'], ['iptchamb1', 'Petite Chambre 1 (chevet 1)'],
  ['iptchamb2', 'Petite Chambre 1 (chevet 2)'], ['iptchamb22', 'Petite Chambre 2 (chevet)'],
  ['iptchamb3', 'Petite Chambre 3 (chevet)'], ['idressing', 'Dressing (placards)'],
];

export const isLightId = (id: string): boolean => LIGHT_NAME_CATALOG.some(([i]) => i === id);

export const defaultLightName = (id: string): string => LIGHT_NAME_CATALOG.find(([i]) => i === id)?.[1] ?? id;

/** Nom affiché : le nom personnalisé s'il existe, sinon le nom d'origine (valeur de repli si la lecture a échoué). */
export const displayLightName = (id: string, names: ReadonlyArray<LightNameValue>, fallback?: string): string => {
  const entry = names.find((n) => n.id === id);
  const custom = entry?.name?.trim();
  if (custom) return custom;
  return entry?.default ?? fallback ?? defaultLightName(id);
};

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;

export type LightNameResult = { ok: true; name: string } | { ok: false; error: string };

/** Valide la saisie : 1 à 40 caractères après rognage, sans caractère de contrôle ni < >. */
export const parseLightName = (input: string): LightNameResult => {
  const name = input.trim();
  const length = Array.from(name).length;
  if (length < MIN_NAME_LENGTH || length > MAX_NAME_LENGTH) {
    return { ok: false, error: `Le nom doit comporter de ${MIN_NAME_LENGTH} à ${MAX_NAME_LENGTH} caractères.` };
  }
  if (CONTROL_CHARS.test(name) || /[<>]/.test(name)) {
    return { ok: false, error: 'Le nom ne peut pas contenir de caractère de contrôle ni de < ou >.' };
  }
  return { ok: true, name };
};
