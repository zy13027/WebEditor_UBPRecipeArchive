import { defineConfig } from "vite";

const PLC_TARGET = process.env.VITE_PLC_TARGET || "192.168.0.10";

export default defineConfig({
    base: "./",
    build: {
        outDir: "dist/palletEditor",
        assetsDir: "assets",
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: undefined
            }
        }
    },
    server: {
        host: true,
        port: 5173,
        proxy: {
            "/api": {
                target: `https://${PLC_TARGET}`,
                changeOrigin: true,
                secure: false
            }
        }
    }
});
