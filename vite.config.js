/// <reference types="vitest" />

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import browserslistToEsbuild from 'browserslist-to-esbuild'
import { Features } from 'lightningcss'
import { resolve as r } from 'node:path'
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

  const target = '> 0.5%, last 2 versions, Firefox ESR, not dead'

  return {
    base,
    resolve: {
      alias: {
        '~': r('src'),
        '~cwd': cwd,
        'micromark-extension-math': 'micromark-extension-llm-math',
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
      Pages({}),

      // https://github.com/antfu/unplugin-auto-import
      AutoImport({
        imports: [
          {
            react: [
              'Suspense',
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
            clsx: ['clsx'],
          },
          {
            type: true,
            from: 'react',
            imports: ['ComponentProps'],
          },
        ],
        dts: 'src/types/auto-imports.d.ts',
      }),

      tailwindcss(),

      unpluginIcons({
        compiler: 'jsx',
        jsx: 'react',
        scale: 1,
      }),
    ],

    css: {
      transformer: 'lightningcss',
      lightningcss: {
        // https://lightningcss.dev/transpilation.html#feature-flags
        include: Features.Colors | Features.Nesting | Features.MediaRangeSyntax,
        exclude: Features.LogicalProperties,

        cssModules: {
          generateScopedName: '[hash:base64:8]',
        },
      },
      devSourcemap: true,
      modules: {
        generateScopedName: '[hash:base64:8]',
      },
    },

    optimizeDeps: {
      include: ['lodash-es'],
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util', '@ffmpeg/core'],
    },

    build: {
      cssMinify: 'lightningcss',
      target: browserslistToEsbuild(target),
    },

    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },

    // https://github.com/vitest-dev/vitest
    test: {
      environment: 'jsdom',
    },
  }
})
