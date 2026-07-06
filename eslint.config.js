import { react } from '@ziloen/eslint-config'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  react({ project: true }),
  { ignores: ['public'] },
  {
    rules: {
      // 和 oxfmt 自动小写冲突
      'unicorn/number-literal-case': 'off',
      'unicorn/prefer-string-raw': 'off',
    },
  },
])
