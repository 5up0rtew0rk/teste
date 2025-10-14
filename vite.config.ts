import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['react', 'react-dom']
  },
  build: {
    // Otimizações para melhor performance
    rollupOptions: {
      output: {
        // Code splitting para carregar apenas o necessário
        manualChunks: {
          vendor: ['react', 'react-dom'],
          lucide: ['lucide-react']
        }
      }
    },
    // Comprimir assets
    minify: 'terser',
    // Otimizar imagens e assets
    assetsInlineLimit: 4096, // Assets menores que 4kb serão inline
    chunkSizeWarningLimit: 1000,
    target: 'esnext', // Para melhor otimização
    sourcemap: false // Desabilitar sourcemaps em produção para performance
  },
  // Preload de recursos críticos
  server: {
    host: '0.0.0.0', // Permite acesso externo
    port: 5173,
    strictPort: true,
    preTransformRequests: false
  },
  // CSS otimizations
  css: {
    devSourcemap: false
  },
  // Otimizações de performance
  esbuild: {
    // Remover console.log em produção
    drop: ['console', 'debugger']
  }
});
