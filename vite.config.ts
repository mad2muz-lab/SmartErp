import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    hmr: false, // Completely disable WebSocket/HMR
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      external: [
        'react-native',
        'react-native-web',
        'react-native-reanimated',
        'react-native-safe-area-context',
        'react-native-gesture-handler',
        'react-native-screens',
        'react-native-svg',
        '@react-native-async-storage/async-storage',
        'expo-camera',
        'expo-file-system',
        'expo-linking',
        'expo-local-authentication',
        'expo-media-library',
        'expo-print',
        'expo-router',
        'expo-secure-store',
        'expo-sharing',
        'expo-splash-screen',
        'expo-status-bar',
        'expo-system-ui',
        'expo-web-browser',
        'native-base',
        '@testing-library/react-native'
      ],
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      plugins: [
        {
          name: 'resolve-globalthis',
          resolveId(id) {
            if (id.includes('globalThis') || id.includes('define-globalThis')) {
              return id;
            }
            return null;
          },
          load(id) {
            if (id.includes('globalThis') || id.includes('define-globalThis')) {
              return 'export default globalThis;';
            }
            return null;
          }
        }
      ]
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: [
      'react-native',
      'react-native-web',
      'react-native-reanimated',
      'react-native-safe-area-context',
      'react-native-gesture-handler',
      'react-native-screens',
      'react-native-svg',
      '@react-native-async-storage/async-storage',
      'expo-camera',
      'expo-file-system',
      'expo-linking',
      'expo-local-authentication',
      'expo-media-library',
      'expo-print',
      'expo-router',
      'expo-secure-store',
      'expo-sharing',
      'expo-splash-screen',
      'expo-status-bar',
      'expo-system-ui',
      'expo-web-browser',
      'native-base',
      '@testing-library/react-native'
    ],
  },
  }
})
