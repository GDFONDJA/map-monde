import { defineConfig } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  base: './',
  // Une seule bibliothèque de cartes, conservée dans le dossier images du projet.
  publicDir: resolve(root, '../images'),
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  build: { rolldownOptions: { input: {
    accueil: resolve(root, 'index.html'),
    jeu: resolve(root, 'jeu.html'),
    records: resolve(root, 'records.html'),
  } } },
});
