import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/drift-tasks/", // must match your GitHub repo name exactly
  plugins: [react()],
  server: { port: 5173 },
});
