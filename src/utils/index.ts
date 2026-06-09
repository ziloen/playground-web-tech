import type { ClassValue } from 'clsx'
import clsx from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

export { LRUCache } from './LRUCache'
export { isInstanceofElement } from './isInstanceofElement'

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

/**
 * Inserts a separator between each element of the provided array.
 *
 * @param array - The source array whose elements will be interspersed.
 * @param separator - The value to insert between consecutive elements of `array`.
 * @returns A new array with `separator` placed between every two elements of `array`.
 *          When the separator type is assignable to the element type, the return type
 *          is narrowed to the element type array; otherwise it is a union array.
 *
 * @example
 * ```ts
 * intersperse([1, 2, 3], 0)
 * // => [1, 0, 2, 0, 3]
 *
 * intersperse(['a', 'b'], ', ')
 * // => ['a', ', ', 'b']
 * ```
 */
/*#__NO_SIDE_EFFECTS__*/
export function intersperse<T, K>(array: T[], separator: K) {
  return array.reduce<(T | K)[]>((acc, item, index) => {
    if (index > 0) {
      acc.push(separator, item)
    } else {
      acc.push(item)
    }
    return acc
  }, []) as K extends T ? T[] : (T | K)[]
}
