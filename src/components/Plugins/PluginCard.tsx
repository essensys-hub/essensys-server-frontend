import React, { useEffect, useState } from 'react';
import {
  PluginClient,
  PluginPanel,
  type Descriptor,
  type HistoryRange,
  type Point,
  type Reading,
} from '../../lib/plugin-renderer';
import '../../lib/plugin-renderer/plugin.css';

const client = new PluginClient();
const POLL_MS = 10_000;
const HISTORY_POLL_MS = 60_000;

interface PluginCardProps {
  pluginId: string;
  /** titre de repli tant que le descripteur n'est pas chargé */
  fallbackTitle?: string;
}

/**
 * Carte d'un plugin, rendue par le renderer générique server-driven (partagé
 * avec le portail cloud). Lecture seule : elle ne fait que GET /api/plugins/*.
 */
export function PluginCard({ pluginId, fallbackTitle = '' }: PluginCardProps): React.JSX.Element | null {
  const [descriptor, setDescriptor] = useState<Descriptor | undefined>();
  const [reading, setReading] = useState<Reading | undefined>();
  const [history, setHistory] = useState<Point[] | undefined>();
  const [available, setAvailable] = useState(true);
  const [range, setRange] = useState<HistoryRange>('day');

  useEffect(() => {
    let alive = true;

    client
      .descriptor(pluginId)
      .then((d) => alive && setDescriptor(d))
      .catch(() => alive && setAvailable(false));

    const poll = () =>
      client
        .current(pluginId)
        .then((r) => alive && setReading(r))
        .catch(() => {
          /* garde la dernière valeur ; l'état stale est porté par la lecture */
        });

    poll();
    const id = window.setInterval(poll, POLL_MS);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [pluginId]);

  // Série de la courbe du dashboard (si le descripteur en déclare une), pour la période choisie via les chips.
  const chartMetric = descriptor?.dashboard?.chart?.metric;
  useEffect(() => {
    if (!chartMetric) return;
    let alive = true;
    const poll = () =>
      client
        .history(pluginId, chartMetric, { range })
        .then((h) => alive && setHistory(h.points))
        .catch(() => {
          /* la courbe affiche "historique en construction" tant que rien n'arrive */
        });
    poll();
    const id = window.setInterval(poll, HISTORY_POLL_MS);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [pluginId, chartMetric, range]);

  if (!available) {
    return (
      <PluginPanel
        descriptor={{ plugin_id: pluginId, title: fallbackTitle, metrics: [], read_only: true }}
        available={false}
      />
    );
  }
  if (!descriptor) return null;

  return (
    <PluginPanel
      descriptor={descriptor}
      reading={reading}
      history={history}
      available={available}
      historyRange={range}
      onHistoryRangeChange={setRange}
    />
  );
}
