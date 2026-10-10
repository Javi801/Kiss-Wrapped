import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        // Vendor groups only spread the initial load across files; they do not defer anything.
        codeSplitting: {
          // Off so a group cannot absorb modules the entry also uses,
          // which would make the entry load that whole group at startup.
          includeDependenciesRecursively: false,
          // No recharts group: its transitive dependencies would stay in the lazy StatsScreen
          // chunk and the two chunks would import each other.
          groups: [
            { name: "react", test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: "motion", test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.js"],
      exclude: ["src/lib/__tests__/**", "src/lib/device-storage.js", "src/lib/utils.js"],
      thresholds: {
        statements: 95,
        branches: 90,
        functions: 95,
        lines: 95,
      },
    },
  },
})