import type { Dispatch, SetStateAction } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useMemoizedFn } from './useMemoizedFn'

/**
 * 自动重置状态
 * @param defautValue 初始值 & 重置状态值
 * @param resetMilliseconds 自动重置时间，单位毫秒 ms，默认 1000ms
 * @example
 * ```tsx
 * const [copied, setCopied] = useAutoResetState(false, 1_000)
 *
 * function onCopyClick() {
 *   copyToClipboard(text)
 *   setCopied(true)
 * }
 *
 * return (
 *   copied
 *    ? <span>已复制</span>
 *    : <button onClick={onCopyClick}>复制</button>
 * )
 * ```
 */
export function useAutoResetState<T>(
  defautValue: T,
  resetMilliseconds = 1_000,
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(defautValue)
  const timer = useRef<number | undefined>(undefined)

  const set: typeof setState = useMemoizedFn((value) => {
    setState(value)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState(defautValue), resetMilliseconds)
  })

  useEffect(() => () => clearTimeout(timer.current), [])

  return [state, set] as const
}
