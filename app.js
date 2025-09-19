import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: '.',
    publicDir: 'public',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: process.env.NODE_ENV !== 'production',
        minify: process.env.NODE_ENV === 'production' ? 'terser' : false,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html')
            },
            output: {
                manualChunks: undefined,
                entryFileNames: 'assets/[name]-[hash].js',
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]'
            }
        },
        terserOptions: {
            compress: {
                drop_console: process.env.NODE_ENV === 'production'
            }
        }
    },
    server: {
        port: 3000,
        host: true,
        open: true,
        cors: true
    },
    preview: {
        port: 3000,
        host: true
    },
    css: {
        devSourcemap: true
    }
});