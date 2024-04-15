/// <reference types="vitest" />

import react from '@vitejs/plugin-react-swc'
import { Features } from 'lightningcss'
import { resolve as r } from 'node:path'
import tailwindcss from 'tailwindcss'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vite'
import Pages from 'vite-plugin-pages'

export default defineConfig(({ command, mode }) => {
  const IS_PROD = process.env.NODE_ENV === 'production'
  const IS_DEV = process.env.NODE_ENV === 'development'
  const IS_BUILD = command === 'build'

  return {
    base: '/playground-web-tech/',
    resolve: {
      alias: {
        '~': r('src'),
        '~cwd': process.cwd(),
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
      Pages(),

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
        plugins: [tailwindcss()],
      },
    },

    build: {
      cssMinify: 'lightningcss',
    },

    // https://github.com/vitest-dev/vitest
    test: {
      environment: 'jsdom',
    },
  }
})
