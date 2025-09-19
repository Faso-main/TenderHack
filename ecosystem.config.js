import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: '.',
    publicDir: 'public',
    appType: 'spa',
    server: {
        port: 3001,
        host: true,
        open: true,
        cors: true,
        middlewareMode: false
    },
    preview: {
        port: 3001,
        host: true
    },
    css: {
        devSourcemap: true
    },
    // Отключаем сборку для production, так как будем использовать Express
    build: false
});