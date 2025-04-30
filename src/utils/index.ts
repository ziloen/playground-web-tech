export { LRUCache } from './LRUCache'
import type { ClassValue } from 'clsx'
import clsx from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const twMerge = /* #__PURE__ */ extendTailwindMerge({
  override: {
    conflictingClassGroups: {
      'font-size': [],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs))
}
