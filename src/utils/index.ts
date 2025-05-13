import type { ClassValue } from 'clsx'
import clsx from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

export { LRUCache } from './LRUCache'

const twMerge = /* #__PURE__ */ extendTailwindMerge({
  override: {
    conflictingClassGroups: {
      'font-size': [],
    },
  },
})

/*#__NO_SIDE_EFFECTS__*/
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs))
}
