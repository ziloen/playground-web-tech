import { defineConfig, preset } from '@ziloen/tailwind-config'

export default defineConfig({
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  darkMode: ['variant', [`[data-theme="dark"] &`, `:host([data-theme="dark"]) &`]],
  presets: [preset],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      fontFamily: {
        'noto-sans-sc': [
          'Noto Sans SC Variable',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'Noto Color Emoji',
        ],
        'fira-code': [
          'Fira Code Variable',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace',
        ],
      },
    },
  },
})
