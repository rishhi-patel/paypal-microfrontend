import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: [
      ".",                  // keep localhost
      "codespace.exotrend.live", // allow your Codespace domain
    ],
    proxy: {
      "/clientid": "http://localhost:8080",
      "/orders": "http://localhost:8080",
      "^/capture/.*": "http://localhost:8080",
    },
  },
})
