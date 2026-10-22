/**
 * Exporta o dataset completo em NDJSON para backups locais.
 * Uso: npm run export:dataset
 * Requer SANITY_API_TOKEN em .env.local.
 */
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { projectId, dataset, requireToken } from './lib.mjs';

const token = requireToken();
const backupsDir = path.resolve(process.cwd(), 'backups');
fs.mkdirSync(backupsDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const target = path.join(backupsDir, `dataset-${dataset}-${stamp}.ndjson`);

const url = `https://${projectId}.api.sanity.io/v2026-07-25/data/export/${dataset}`;
console.log(`Exportando dataset "${dataset}" de ${projectId}...`);

const response = await fetch(url, {
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: 'application/x-ndjson, application/json',
  },
});

if (!response.ok || !response.body) {
  const body = await response.text().catch(() => '');
  throw new Error(`Falha na exportação (HTTP ${response.status}): ${body.slice(0, 500)}`);
}

await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(target));

const { size } = fs.statSync(target);
const lines = fs.readFileSync(target, 'utf8').split('\n').filter(Boolean).length;

console.log(`Backup concluído: ${target}`);
console.log(`Documentos: ${lines} • Tamanho: ${(size / 1024 / 1024).toFixed(2)} MB`);
