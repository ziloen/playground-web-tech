/// <reference types="vitest" />

import react from '@vitejs/plugin-react-swc'
import { resolve as r } from 'node:path'
import PostcssPresetEnv from 'postcss-preset-env'
import tailwindcss from 'tailwindcss'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig, loadEnv } from 'vite'
import Pages from 'vite-plugin-pages'

export default defineConfig(({ command, mode }) => {
  const cwd = process.cwd()
  const env = loadEnv(mode, cwd)

  const IS_PROD = env.PROD
  const IS_DEV = env.DEV
  const IS_BUILD = command === 'build'

  return {
    base: env.VITE_BASE_URL,
    resolve: {
      alias: {
        '~': r('src'),
        '~cwd': cwd,
      },
    },

    define: {
      IS_BUILD,
      IS_DEV,
      IS_PROD,
    },

    plugins: [
      react(),

      // https://github.com/hannoeru/vite-plugin-pages
      Pages({
        importMode: 'async',
      }),

      // https://github.com/antfu/unplugin-auto-import
      AutoImport({
        imports: [
          {
            react: [
              'Suspense',
              'forwardRef',
              'useCallback',
              'useEffect',
              'useImperativeHandle',
              'useLayoutEffect',
              'useMemo',
              'useRef',
              'useState',
            ],
            'react-router-dom': ['useNavigate', 'useParams', 'useRoutes'],
            'framer-motion': ['motion', 'AnimatePresence'],
            'react-i18next': ['useTranslation'],
            'clsx': ['clsx'],
          },
        ],
        dts: 'src/types/auto-imports.d.ts',
      }),
    ],

    css: {
      devSourcemap: true,
      // transformer: 'lightningcss',
      // lightningcss: {
      //   include: Features.Colors | Features.Nesting | Features.MediaQueries,
      // },
      postcss: {
        plugins: [PostcssPresetEnv({ stage: 0 }), tailwindcss()],
      },
    },

    optimizeDeps: {
      include: ['lodash-es'],
    },

    build: {
      cssMinify: 'esbuild',
    },

    // https://github.com/vitest-dev/vitest
    test: {
      environment: 'jsdom',
    },
  }
})
