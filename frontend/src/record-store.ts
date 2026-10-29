import type { PersonalRecord, Stage } from './types';
import { MAX_HELPS, SECONDS_PER_PIECE } from './rules';

const KEY = 'mapmonde.records';
const integer = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0;

export function readRecords(): Record<string, PersonalRecord> {
  const records: Record<string, PersonalRecord> = Object.create(null);
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return records;
    for (const [id, value] of Object.entries(saved)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
      const entry = value as Record<string, unknown>;
      const helps = entry.helps === undefined ? 0 : entry.helps;
      const errors = entry.errors === undefined ? 0 : entry.errors;
      if (integer(entry.score) && integer(entry.time) && integer(helps) && integer(errors)) {
        records[id] = { score: entry.score, time: entry.time, helps, errors };
      }
    }
  } catch {
    // Un stockage indisponible n’empêche pas de jouer ou d’ouvrir la page.
  }
  return records;
}

export function recordForStage(stage: Stage, records: Record<string, PersonalRecord>): PersonalRecord | null {
  const record = records[stage.id];
  if (!record || !integer(record.score) || !integer(record.time) || !integer(record.helps) || !integer(record.errors)) return null;
  if (record.score > stage.pieces.length * 100 || record.time > stage.pieces.length * SECONDS_PER_PIECE || record.helps > MAX_HELPS) return null;
  return record;
}

export function writeRecords(records: Record<string, PersonalRecord>): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(records)); return true; }
  catch { return false; }
}
