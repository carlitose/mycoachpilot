import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
export default defineConfig({
    plugins: [react()],
    server: {
        port: 13000,
    },
    preview: {
        port: 13000,
    },
    resolve: {
        alias: {
            '@domain': resolve(__dirname, 'src/domain'),
            '@application': resolve(__dirname, 'src/application'),
            '@infrastructure': resolve(__dirname, 'src/infrastructure'),
            '@presentation': resolve(__dirname, 'src/presentation'),
            '@shared': resolve(__dirname, 'src/domain/shared'),
        },
    },
});
