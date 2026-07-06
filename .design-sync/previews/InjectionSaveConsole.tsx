import { InjectionSaveConsole } from 'essensys-web-react';

const logs = [
  { id: '1', time: '14:32:01', level: 'info', message: 'Préparation de l’injection (84 paramètres)' },
  { id: '2', time: '14:32:02', level: 'info', message: 'Envoi du lot 1/4 — indices 40 à 60' },
  { id: '3', time: '14:32:03', level: 'success', message: 'Lot 1/4 confirmé (HTTP 200)' },
  { id: '4', time: '14:32:04', level: 'info', message: 'Envoi du lot 2/4 — indices 61 à 81' },
];

export const Running = () => (
  <div className="max-w-xl">
    <InjectionSaveConsole
      progress={{ currentChunk: 2, totalChunks: 4, totalParams: 84, status: 'running' }}
      logs={logs}
      visible
      title="Console d'injection"
      subtitle="Écriture du planning vers la passerelle"
    />
  </div>
);

export const Success = () => (
  <div className="max-w-xl">
    <InjectionSaveConsole
      progress={{ currentChunk: 4, totalChunks: 4, totalParams: 84, status: 'success' }}
      logs={[...logs, { id: '5', time: '14:32:06', level: 'success', message: 'Injection terminée — 84 paramètres écrits' }]}
      visible
      title="Console d'injection"
    />
  </div>
);
