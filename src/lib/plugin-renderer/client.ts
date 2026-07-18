// ⚠️ SYNCED depuis essensys-plugin-framework/ts/src — NE PAS ÉDITER ICI.
// Modifier dans le dépôt framework puis relancer scripts/sync-plugin-renderer.sh

// Client de l'API moderne /api/plugins/*. Lecture seule via guardedFetch.
import type { Descriptor, History, PluginInfo, Reading } from "./descriptor";
import { guardedFetch } from "./noArmoire";

export interface PluginClientOptions {
  /** base URL (défaut: origine courante). */
  baseUrl?: string;
}

/** Fenêtre de la courbe historique (chips jour/semaine/mois/année). */
export type HistoryRange = "day" | "week" | "month" | "year";

export class PluginClient {
  private base: string;
  constructor(opts: PluginClientOptions = {}) {
    this.base = (opts.baseUrl ?? "").replace(/\/$/, "");
  }

  private async get<T>(path: string): Promise<T> {
    // credentials: include -> envoie le cookie de session (auth LAN/portail).
    const res = await guardedFetch(`${this.base}${path}`, { method: "GET", credentials: "include" });
    if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
    return (await res.json()) as T;
  }

  descriptor(pluginId: string): Promise<Descriptor> {
    return this.get<Descriptor>(`/api/plugins/${pluginId}/descriptor`);
  }

  current(pluginId: string): Promise<Reading> {
    return this.get<Reading>(`/api/plugins/${pluginId}/current`);
  }

  /** Série historisée d'une métrique pour les courbes (fenêtre glissante ou range jour/semaine/mois/année). */
  history(
    pluginId: string,
    metric: string,
    opts: { hours?: number; range?: HistoryRange } | number = 24,
  ): Promise<History> {
    const q = new URLSearchParams({ metric });
    if (typeof opts === "number") {
      q.set("hours", String(opts));
    } else if (opts.range) {
      q.set("range", opts.range);
    } else {
      q.set("hours", String(opts.hours ?? 24));
    }
    return this.get<History>(`/api/plugins/${pluginId}/history?${q}`);
  }

  private async post<T>(path: string): Promise<T> {
    const res = await guardedFetch(`${this.base}${path}`, { method: "POST", credentials: "include" });
    if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
    return (await res.json()) as T;
  }

  /** Catalogue des plugins compilés (écran Paramètres). */
  list(): Promise<PluginInfo[]> {
    return this.get<PluginInfo[]>(`/api/plugins/`);
  }

  /** Active un plugin (admin). Renvoie le catalogue à jour. */
  enable(pluginId: string): Promise<PluginInfo[]> {
    return this.post<PluginInfo[]>(`/api/plugins/${pluginId}/enable`);
  }

  /** Désactive un plugin (admin), données conservées. */
  disable(pluginId: string): Promise<PluginInfo[]> {
    return this.post<PluginInfo[]>(`/api/plugins/${pluginId}/disable`);
  }

  /** Désinstalle : désactive et efface snapshot + historique (admin). */
  purge(pluginId: string): Promise<PluginInfo[]> {
    return this.post<PluginInfo[]>(`/api/plugins/${pluginId}/purge`);
  }
}
