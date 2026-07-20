// Copia el worker de pdf.js a /public para servirlo como asset estático.
// La importación de pólizas de seguros (PDF) lo carga desde /pdf.worker.min.mjs;
// copiarlo aquí evita depender de cómo resuelva el bundler la URL del worker.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
const dest = join(root, 'public', 'pdf.worker.min.mjs');

if (!existsSync(src)) {
    console.warn('[copy-pdf-worker] pdfjs-dist no está instalado; se omite la copia');
    process.exit(0);
}

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
console.log('[copy-pdf-worker] public/pdf.worker.min.mjs actualizado');
