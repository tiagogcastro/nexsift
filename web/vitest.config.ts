import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  oxc: false,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    env: {
      NEXT_PUBLIC_SITE_URL: 'https://nexsift.com',
    },
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
    tsconfigRaw: JSON.stringify({
      compilerOptions: {
        jsx: 'react-jsx',
        target: 'es2022',
        module: 'esnext',
        moduleResolution: 'bundler',
      },
    }),
  },
})
