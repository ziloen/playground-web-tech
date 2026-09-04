import { createCn } from 'cn/config'

export { isInstanceofElement } from './isInstanceofElement'
export { LRUCache } from './LRUCache'

/*#__NO_SIDE_EFFECTS__*/
export const cn = /* #__PURE__ */ createCn({
  override: {
    conflictingClassGroups: {
      // In the default config the value is ['leading']
      // https://github.com/dcastil/tailwind-merge/issues/446#issuecomment-2248766088
      'font-size': [],
    },
  },
})

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

/**
 * Creates a custom props comparison function for use with `React.memo`.
 * Each key in `comparers` can override the default `Object.is` equality check.
 *
 * @example
 * ```ts
 * const areEqual = propsEqualWith<{ items: string[]; config: Config }>({
 *   items: (a, b) => a.length === b.length && a.every((v, i) => v === b[i]),
 * })
 * export default React.memo(MyComponent, areEqual)
 * ```
 */
/*#__NO_SIDE_EFFECTS__*/
export function propsEqualWith<P extends Record<string, any>>(
  comparers: NoInfer<{
    [K in keyof P]?: (prevValue: P[K], nextValue: P[K]) => boolean
  }>,
): (prevProps: P, nextProps: P) => boolean {
  return function arePropsEqual(prevProps, nextProps) {
    const prevKeys = Object.keys(prevProps)
    const nextKeys = Object.keys(nextProps)

    if (prevKeys.length !== nextKeys.length) {
      return false
    }

    for (const key of prevKeys) {
      if (!Object.hasOwn(nextProps, key)) {
        return false
      }

      const comparer = comparers[key] ?? Object.is

      if (!comparer(prevProps[key], nextProps[key])) {
        return false
      }
    }

    return true
  }
}
