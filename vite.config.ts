import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@domain": "/src/domain",
      "@application": "/src/application",
      "@infrastructure": "/src/infrastructure",
      "@ui": "/src/ui",
      "@styles": "/src/styles",
    },
  },
  server: {
    port: 5173,
  },
});
