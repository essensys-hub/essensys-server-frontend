import { ActionButton } from 'essensys-web-react';
import { BoltIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export const Variants = () => (
  <div className="flex flex-wrap items-center gap-3">
    <ActionButton label="Activer" variant="primary" onClick={() => {}} />
    <ActionButton label="Annuler" variant="secondary" onClick={() => {}} />
    <ActionButton label="Supprimer" variant="danger" onClick={() => {}} />
    <ActionButton label="Valider" variant="success" onClick={() => {}} />
  </div>
);

export const Sizes = () => (
  <div className="flex flex-wrap items-center gap-3">
    <ActionButton label="Petit" size="sm" onClick={() => {}} />
    <ActionButton label="Moyen" size="md" onClick={() => {}} />
    <ActionButton label="Grand" size="lg" onClick={() => {}} />
  </div>
);

export const WithIcon = () => (
  <div className="flex flex-wrap items-center gap-3">
    <ActionButton label="Lancer le scénario" variant="primary" icon={BoltIcon} onClick={() => {}} />
    <ActionButton label="Réinitialiser" variant="secondary" icon={ArrowPathIcon} onClick={() => {}} />
    <ActionButton label="Effacer" variant="danger" icon={TrashIcon} onClick={() => {}} />
  </div>
);

export const States = () => (
  <div className="flex flex-wrap items-center gap-3">
    <ActionButton label="Désactivé" disabled onClick={() => {}} />
    <ActionButton label="Chargement" loading onClick={() => {}} />
    <ActionButton label="Actif" variant="primary" onClick={() => {}} />
  </div>
);
