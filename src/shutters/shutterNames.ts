/**
 * Noms personnalisés des volets et stores (noms-volets-2026-11-005).
 *
 * Contrat (portail local) : GET /api/shutters/names, PUT /api/admin/shutters/names/{id} body {"name": "Volet baie vitrée"}
 * ou {"name": null} (retour au nom d'origine). Le nom est affiché en texte brut (jamais en HTML).
 * Verrouillé par NR-server-frontend-9.
 */
import { MAX_NAME_LENGTH, MIN_NAME_LENGTH } from '../lights/lightNames';

export interface ShutterNameValue {
  id: string;
  /** Nom d'origine. */
  default: string;
  /** Nom personnalisé, null si aucun. */
  name: string | null;
  version: number;
  updated_at: string | null;
}

export type ShutterNameWriteStatus = 'saved' | 'dry_run';

export { MAX_NAME_LENGTH, MIN_NAME_LENGTH };

/** Catalogue (ordre d'affichage) : id commun aux clients et nom d'origine. */
export const SHUTTER_NAME_CATALOG: ReadonlyArray<readonly [string, string]> = [
  ['volet1salon', 'Volet 1 Salon'], ['volet2salon', 'Volet 2 Salon'], ['volet3salon', 'Volet 3 Salon'],
  ['volet1salleamanger', 'Volet 1 Salle à Manger'], ['volet2salleamanger', 'Volet 2 Salle à Manger'],
  ['volet1cuisine', 'Volet 1 Cuisine'], ['volet2cuisine', 'Volet 2 Cuisine'], ['voletsdb', 'Volet Salle de Bain 1'],
  ['volet1gdchamb', 'Volet 1 Grande Chambre'], ['volet2gdchamb', 'Volet 2 Grande Chambre'],
  ['volet1ptchamb', 'Volet Petite Chambre 1'], ['volet2ptchamb', 'Volet Petite Chambre 2'],
  ['volet3ptchamb', 'Volet Petite Chambre 3'], ['voletbureau', 'Volet Bureau'],
  ['voletstore', 'Volet "Store"'], ['store', 'Store (banne)'],
];

export const isShutterId = (id: string): boolean => SHUTTER_NAME_CATALOG.some(([i]) => i === id);

export const defaultShutterName = (id: string): string => SHUTTER_NAME_CATALOG.find(([i]) => i === id)?.[1] ?? id;

/** Nom affiché : le nom personnalisé s'il existe, sinon le nom d'origine (valeur de repli si la lecture a échoué). */
export const displayShutterName = (id: string, names: ReadonlyArray<ShutterNameValue>, fallback?: string): string => {
  const entry = names.find((n) => n.id === id);
  const custom = entry?.name?.trim();
  if (custom) return custom;
  return entry?.default ?? fallback ?? defaultShutterName(id);
};

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;

export type ShutterNameResult = { ok: true; name: string } | { ok: false; error: string };

/** Valide la saisie : 1 à 40 caractères après rognage, sans caractère de contrôle ni < >. */
export const parseShutterName = (input: string): ShutterNameResult => {
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
