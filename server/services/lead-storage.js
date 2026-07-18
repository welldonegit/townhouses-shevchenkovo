// Резервное сохранение заявок в локальный JSONL-файл (защитная сетка на случай,
// если внешние каналы недоступны). Файл содержит ПДн — путь вне git.
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/env.js';

export async function saveLead(lead) {
  try {
    const file = config.leadsFile;
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.appendFile(file, JSON.stringify(lead) + '\n', 'utf8');
    return { ok: true };
  } catch (err) {
    // В лог — только техническое сообщение, без содержимого заявки.
    console.error('[storage] persist failed:', err.message);
    return { ok: false, error: 'storage_error' };
  }
}
