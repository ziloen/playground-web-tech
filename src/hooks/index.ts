export { useAutoResetState } from './useAutoResetState'
export { useGetState } from './useGetState'
export { useLatest } from './useLatest'
export { useMemoizedFn } from './useMemoizedFn'
export { useNextEffect } from './useNextEffect'

/**
 * @example
 * ```tsx
 * const ref1 = useRef(null)
 * const ref2 = useRef(null)
 * const ref3 = useRef(null)
 *
 * <div ref={mergeRefs(ref1, ref2, ref3)} />
 * ```
 */
export function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]): React.RefCallback<T> {
  return function(instance: T | null) {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(instance)
      } else if (ref) {
        ref.current = instance
      }
    }
  }
}
