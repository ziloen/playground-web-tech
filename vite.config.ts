/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react-swc'
import { resolve as r } from 'node:path'
import PostcssPresetEnv from 'postcss-preset-env'
import Unocss from 'unocss/vite'
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
      }
    },

    define: {
      IS_BUILD,
      IS_DEV,
      IS_PROD,
    },

    plugins: [
    // https://github.com/antfu/unocss
    // see unocss.config.ts for config
      Unocss(),

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
            clsx: ['clsx']
          },
        ],
        dts: 'src/types/auto-imports.d.ts'
      }),
    ],

    css: {
      postcss: {
        plugins: [PostcssPresetEnv({ stage: 0 })]
      }
    },

    // https://github.com/vitest-dev/vitest
    test: {
      environment: 'jsdom'
    }
  }
})
