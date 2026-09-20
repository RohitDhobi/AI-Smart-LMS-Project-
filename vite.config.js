import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isElectron = process.env.ELECTRON === "true";

export default defineConfig({
  plugins: [react()],
  base: isElectron ? "./" : "/",
  server: {
    port: 5173,
    watch: {
      // Headless-Chrome test profiles (.chrome-test-profile) contain
      // locked files that crash Vite's watcher on Windows with EBUSY.
      ignored: ["**/.chrome-test-profile/**", "**/dist/**"]
    }
  }
});
