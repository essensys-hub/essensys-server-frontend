/** Limite firmware BP_MQX_ETH (Json.c / sc_TraitementAction) — max params par action. */
export const MAX_FIRMWARE_PARAMS_PER_ACTION = 30;

export const injectionChunkCount = (paramCount: number): number =>
  paramCount <= 0 ? 0 : Math.ceil(paramCount / MAX_FIRMWARE_PARAMS_PER_ACTION);

export const chunkInjectionParams = <T>(items: T[], max = MAX_FIRMWARE_PARAMS_PER_ACTION): T[][] => {
  if (items.length === 0) return [];
  if (items.length <= max) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += max) {
    chunks.push(items.slice(i, i + max));
  }
  return chunks;
};

export const formatInjectionLimitHint = (paramCount: number): string => {
  const chunks = injectionChunkCount(paramCount);
  if (paramCount === 0) return '';
  if (chunks <= 1) {
    return `${paramCount} octet${paramCount > 1 ? 's' : ''} · 1 envoi armoire`;
  }
  return `${paramCount} octets · ${chunks} envois armoire (max ${MAX_FIRMWARE_PARAMS_PER_ACTION}/envoi)`;
};
