export interface SavedKGConfig {
  id: string;
  name: string;
  savedAt: string;
  sourceId: string;
  sourceLabel: string;
  classes: { name: string; count: number; properties: string[] }[];
  relations: { name: string; from: string; to: string; count: number }[];
}

const KEY = 'kg_saved_configs';

export function getSavedConfigs(): SavedKGConfig[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveKGConfig(cfg: SavedKGConfig): void {
  const existing = getSavedConfigs().filter(c => c.id !== cfg.id);
  localStorage.setItem(KEY, JSON.stringify([cfg, ...existing]));
}

export function deleteKGConfig(id: string): void {
  const updated = getSavedConfigs().filter(c => c.id !== id);
  localStorage.setItem(KEY, JSON.stringify(updated));
}
