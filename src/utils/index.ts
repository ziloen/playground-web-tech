import type { ClassValue } from 'clsx'
import clsx from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

export { LRUCache } from './LRUCache'

const twMerge = /* #__PURE__ */ extendTailwindMerge({
  override: {
    conflictingClassGroups: {
      // In the default config the value is ['leading']
      // https://github.com/dcastil/tailwind-merge/issues/446#issuecomment-2248766088
      'font-size': [],
    },
  },
})

/*#__NO_SIDE_EFFECTS__*/
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(...inputs))
}

/*#__NO_SIDE_EFFECTS__*/
export function formatBytes(bytes: number): string {
  const base = 1024
  let n = 0
  const labels = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB']

  while (bytes > base && n < labels.length - 1) {
    bytes /= base
    n++
  }

  return `${bytes.toFixed(2)}${labels[n]}`
}
