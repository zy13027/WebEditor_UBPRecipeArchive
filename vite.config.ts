import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";

const ROOT_DIR = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, ROOT_DIR, "VITE_");
    const plcTarget = env.VITE_PLC_TARGET || "192.168.0.10";

    return {
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
                    target: `https://${plcTarget}`,
                    changeOrigin: true,
                    secure: false
                }
            }
        }
    };
});
