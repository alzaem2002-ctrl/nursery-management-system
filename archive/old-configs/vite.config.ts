import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    build(),
    devServer({
      adapter,
      entry: 'src/index.tsx'
    })
  ],
  
  // Performance optimizations
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsDir: 'assets',
    
    // Bundle optimization for Cloudflare Workers
    rollupOptions: {
      output: {
        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    
    // Minification and compression
    minify: 'esbuild',
    cssMinify: true,
    
    // Source maps for production debugging
    sourcemap: false,
    
    // Optimize bundle size for Workers
    chunkSizeWarningLimit: 1000
  },
  
  // Development server optimization
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true
  },
  
  // Asset optimization
  assetsInclude: ['**/*.woff', '**/*.woff2', '**/*.ttf'],
  
  // Copy additional files to dist
  publicDir: 'public',
  
  // Define global constants for optimization
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __VERSION__: JSON.stringify(process.env.npm_package_version || '2.0.0')
  }
})
