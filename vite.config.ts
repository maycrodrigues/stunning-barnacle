import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  base:
    process.env.GITHUB_PAGES === "true" && process.env.GITHUB_REPOSITORY?.includes("/")
      ? `/${process.env.GITHUB_REPOSITORY.split("/")[1]}/`
      : "/",
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        // This will transform your SVG to a React component
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-dom/client', 'react-router'],
          'ui-vendor': ['lucide-react', 'sweetalert2', 'swiper'],
          'charts-vendor': ['apexcharts', 'react-apexcharts'],
          'maps-vendor': ['leaflet', 'react-leaflet', '@react-jvectormap/core', '@react-jvectormap/world'],
          'calendar-vendor': [
            '@fullcalendar/core',
            '@fullcalendar/daygrid',
            '@fullcalendar/interaction',
            '@fullcalendar/list',
            '@fullcalendar/react',
            '@fullcalendar/timegrid'
          ],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'state-vendor': ['zustand', 'idb'],
        }
      }
    }
  }
});
