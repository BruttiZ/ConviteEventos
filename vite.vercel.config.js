import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    publicDir: 'vercel-public',
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
});
