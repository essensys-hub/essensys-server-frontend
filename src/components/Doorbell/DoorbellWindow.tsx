import React, { useState } from 'react';
import { BellAlertIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useDoorbellStatus } from '../../doorbell/useDoorbellStatus';
import { doorbellStreamUrl } from '../../doorbell/doorbellApi';

/**
 * Fenêtre « Quelqu'un sonne » : visible sur toutes les pages tant que la sonnerie dure, avec la vidéo de la gateway
 * (instantanés environ une image par seconde). Fermée, elle ne se rouvre que pour la sonnerie suivante.
 * Fonction désactivée ou indisponible : aucune fenêtre et aucune requête vidéo.
 */
export const DoorbellWindow: React.FC = () => {
  const { status, visible, ring, dismiss } = useDoorbellStatus();
  // Échec de la vidéo mémorisé par sonnerie : la sonnerie suivante retente le flux.
  const [failedRing, setFailedRing] = useState<string | null>(null);

  if (!visible || !ring) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" data-testid="doorbell-backdrop">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="doorbell-title"
        className="w-full max-w-2xl max-h-full overflow-auto bg-white rounded-xl shadow-xl p-4 space-y-3"
        data-testid="doorbell-window"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id="doorbell-title" className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <BellAlertIcon className="w-6 h-6 text-essensys-primary" aria-hidden="true" />
            Quelqu&apos;un sonne
          </h2>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Fermer"
            data-testid="doorbell-close"
            className="p-2 rounded border border-gray-300 hover:bg-gray-50"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        {failedRing === ring ? (
          <p role="alert" className="p-3 text-sm bg-amber-50 border border-amber-200 rounded-lg text-amber-900" data-testid="doorbell-video-error">
            Vidéo indisponible pour le moment.
          </p>
        ) : (
          <img
            src={doorbellStreamUrl(ring)}
            alt="Vidéo de la sonnette"
            data-testid="doorbell-video"
            className="w-full rounded-lg bg-black aspect-video object-contain"
            onError={() => setFailedRing(ring)}
          />
        )}
        {!status.in_window && (
          <p className="p-2 text-sm bg-amber-50 border border-amber-200 rounded-lg text-amber-900" data-testid="doorbell-out-of-window">
            hors plage : pas de clignotement ni de notification
          </p>
        )}
        <p className="text-xs text-gray-500">Image rafraîchie environ une fois par seconde.</p>
      </div>
    </div>
  );
};

export default DoorbellWindow;
