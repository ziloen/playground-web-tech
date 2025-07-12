import { loadEnv } from 'vite'

/**
 * @import { Config } from "@react-router/dev/config";
 */

const env = loadEnv('', process.cwd())

let basename = env.VITE_BASE_URL

// https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables#default-environment-variables
if (process.env.GITHUB_REPOSITORY) {
  const slashIndex = process.env.GITHUB_REPOSITORY.indexOf('/')
  basename = process.env.GITHUB_REPOSITORY.slice(slashIndex)
  basename.endsWith('/') || (basename += '/')
}

/**
 * @type {Config}
 */
export default {
  ssr: false,
  appDirectory: 'src',
  buildDirectory: 'dist',
  basename,
}
