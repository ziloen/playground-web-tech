/// <reference types="vitest" />

import react from '@vitejs/plugin-react-swc'
import { resolve as r } from 'node:path'
import PostcssPresetEnv from 'postcss-preset-env'
import tailwindcss from 'tailwindcss'
import AutoImport from 'unplugin-auto-import/vite'
import unpluginIcons from 'unplugin-icons/vite'
import { defineConfig, loadEnv } from 'vite'
import Pages from 'vite-plugin-pages'

export default defineConfig(({ command, mode }) => {
  const cwd = process.cwd()
  const env = loadEnv(mode, cwd)

  const IS_PROD = env.PROD
  const IS_DEV = env.DEV
  const IS_BUILD = command === 'build'

  let base = env.VITE_BASE_URL

  if (process.env.GITHUB_REPOSITORY) {
    const slashIndex = process.env.GITHUB_REPOSITORY.indexOf('/')
    base = process.env.GITHUB_REPOSITORY.slice(slashIndex)
  }

  return {
    base,
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
            'motion/react': ['motion', 'AnimatePresence'],
            'react-i18next': ['useTranslation'],
            'clsx': ['clsx'],
          },
          {
            type: true,
            from: 'react',
            imports: ['ComponentProps'],
          },
        ],
        dts: 'src/types/auto-imports.d.ts',
      }),

      unpluginIcons({
        compiler: 'jsx',
        jsx: 'react',
        scale: 1,
      }),
    ],

    css: {
      devSourcemap: true,
      postcss: {
        plugins: [
          PostcssPresetEnv({
            stage: 0,
            features: {
              'float-clear-logical-values': false,
              'logical-overflow': false,
              'logical-overscroll-behavior': false,
              'logical-properties-and-values': false,
            },
          }),
          tailwindcss(),
        ],
      },
    },

    optimizeDeps: {
      include: ['lodash-es', 'ahooks'],
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
