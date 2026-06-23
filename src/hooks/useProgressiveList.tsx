import { startTransition, useEffect, useLayoutEffect, useMemo, useState } from 'react'

type Direction = 'head' | 'tail'
type ItemKey = string | number

type ProgressiveListOptions<T> = {
  items: readonly T[]
  getKey: (item: NoInfer<T>) => ItemKey
  direction?: Direction
  initialBatch?: number
  batchSize?: number
  enabled?: boolean
  resetKey?: unknown
  debugLabel?: string
}

function commonPrefix(a: readonly ItemKey[], b: readonly ItemKey[]) {
  let i = 0
  const n = Math.min(a.length, b.length)

  while (i < n && a[i] === b[i]) {
    i++
  }

  return i
}

function commonSuffix(a: readonly ItemKey[], b: readonly ItemKey[]) {
  let i = 0
  const n = Math.min(a.length, b.length)

  while (i < n && a[a.length - 1 - i] === b[b.length - 1 - i]) {
    i++
  }

  return i
}

function sameKeys(a: readonly ItemKey[], b: readonly ItemKey[]) {
  if (a.length !== b.length) return false

  return a.every((key, index) => key === b[index])
}

type VisibleWindow = {
  keys: readonly ItemKey[]
  direction: Direction
  resetKey: unknown
  start: number
  end: number
}

type DoneController = {
  promise: Promise<void>
  resolve: () => void
  resolved: boolean
}

function createDoneController(): DoneController {
  let resolve: () => void = () => {}
  const promise = new Promise<void>((done) => {
    resolve = done
  })

  return {
    promise,
    resolve,
    resolved: false,
  }
}

function resolveDone(controller: DoneController) {
  if (controller.resolved) return

  controller.resolved = true
  controller.resolve()
}

function getInitialWindow(
  keys: readonly ItemKey[],
  direction: Direction,
  resetKey: unknown,
  initialBatch: number,
): VisibleWindow {
  const total = keys.length
  const visibleCount = Math.min(total, initialBatch)

  return {
    keys,
    direction,
    resetKey,
    start: direction === 'head' ? 0 : Math.max(0, total - visibleCount),
    end: direction === 'head' ? visibleCount : total,
  }
}

function getNextWindow(
  prev: VisibleWindow,
  keys: readonly ItemKey[],
  direction: Direction,
  resetKey: unknown,
  initialBatch: number,
): VisibleWindow {
  const total = keys.length

  if (prev.resetKey !== resetKey || prev.direction !== direction) {
    return getInitialWindow(keys, direction, resetKey, initialBatch)
  }

  if (sameKeys(prev.keys, keys)) {
    return {
      ...prev,
      keys,
      start: Math.min(prev.start, total),
      end: Math.min(prev.end, total),
    }
  }

  const stablePrefix = commonPrefix(prev.keys, keys)

  if (stablePrefix > 0) {
    const start = prev.start <= stablePrefix ? prev.start : 0

    return {
      keys,
      direction,
      resetKey,
      start,
      end: Math.min(total, stablePrefix + initialBatch),
    }
  }

  const stableSuffix = commonSuffix(prev.keys, keys)

  if (direction === 'tail' && stableSuffix > 0) {
    return {
      keys,
      direction,
      resetKey,
      start: Math.max(0, total - stableSuffix - initialBatch),
      end: total,
    }
  }

  return getInitialWindow(keys, direction, resetKey, initialBatch)
}

function sameWindow(a: VisibleWindow, b: VisibleWindow) {
  return (
    a.direction === b.direction &&
    a.resetKey === b.resetKey &&
    a.start === b.start &&
    a.end === b.end &&
    sameKeys(a.keys, b.keys)
  )
}

function growWindow(window: VisibleWindow, batchSize: number): VisibleWindow {
  if (window.start > 0) {
    return {
      ...window,
      start: Math.max(0, window.start - batchSize),
    }
  }

  return {
    ...window,
    end: Math.min(window.keys.length, window.end + batchSize),
  }
}

function getKeySummary(keys: readonly ItemKey[], pivot: number) {
  const aroundStart = Math.max(0, pivot - 3)
  const aroundEnd = Math.min(keys.length, pivot + 8)

  return {
    count: keys.length,
    head: keys.slice(0, 8),
    aroundPivot: keys.slice(aroundStart, aroundEnd),
    tail: keys.slice(Math.max(0, keys.length - 8)),
  }
}

export function useProgressiveList<T>({
  items,
  getKey,
  direction = 'head',
  initialBatch = 10,
  batchSize = initialBatch,
  enabled = true,
  resetKey,
  debugLabel,
}: ProgressiveListOptions<T>) {
  const total = items.length
  const safeInitialBatch = Math.max(0, initialBatch)
  const safeBatchSize = Math.max(1, batchSize)

  const keys = useMemo(() => items.map(getKey), [items])

  const [visibleWindow, setVisibleWindow] = useState(() =>
    getInitialWindow(keys, direction, resetKey, safeInitialBatch),
  )

  const effectiveWindow = useMemo(
    () => getNextWindow(visibleWindow, keys, direction, resetKey, safeInitialBatch),
    [visibleWindow, keys, direction, resetKey, safeInitialBatch],
  )

  useLayoutEffect(() => {
    if (sameWindow(visibleWindow, effectiveWindow)) {
      return
    }

    setVisibleWindow(effectiveWindow)
  }, [visibleWindow, effectiveWindow])

  useEffect(() => {
    if (!enabled || (effectiveWindow.start === 0 && effectiveWindow.end >= total)) {
      return
    }

    startTransition(() => {
      setVisibleWindow((current) => {
        if (
          current.direction !== direction ||
          current.resetKey !== resetKey ||
          !sameKeys(current.keys, keys)
        ) {
          return current
        }

        const nextWindow = getNextWindow(current, keys, direction, resetKey, safeInitialBatch)

        return growWindow(nextWindow, safeBatchSize)
      })
    })
  }, [enabled, effectiveWindow, total, safeBatchSize, keys, direction, resetKey, safeInitialBatch])

  const start = enabled ? effectiveWindow.start : 0
  const end = enabled ? effectiveWindow.end : total
  const visibleItems = useMemo(() => items.slice(start, end), [items, start, end])
  const done = !enabled || (start === 0 && end >= total)
  const doneController = useMemo(() => createDoneController(), [keys, direction, resetKey, enabled])

  useLayoutEffect(() => {
    if (done) {
      resolveDone(doneController)
    }
  }, [done, doneController])

  useEffect(() => {
    return () => {
      resolveDone(doneController)
    }
  }, [doneController])

  useLayoutEffect(() => {
    if (!debugLabel) {
      return
    }

    const previousVisibleKeys = visibleWindow.keys.slice(visibleWindow.start, visibleWindow.end)
    const visibleKeys = keys.slice(start, end)
    const stablePrefix = commonPrefix(visibleWindow.keys, keys)
    const stableSuffix = commonSuffix(visibleWindow.keys, keys)

    const snapshot = {
      direction,
      resetKey,
      total,
      start,
      end,
      visibleCount: end - start,
      done,
      stablePrefix,
      stableSuffix,
      previousWindow: {
        start: visibleWindow.start,
        end: visibleWindow.end,
        visibleKeys: previousVisibleKeys,
      },
      nextWindow: {
        start,
        end,
        visibleKeys,
      },
      sourceKeys: getKeySummary(keys, stablePrefix),
    }

    console.log(`[useProgressiveList:${debugLabel}] commit ${JSON.stringify(snapshot)}`)
  }, [debugLabel, direction, resetKey, total, start, end, enabled, done, visibleWindow, keys])

  return {
    items: visibleItems,
    start,
    end,
    visibleCount: end - start,
    total,
    done,
    donePromise: doneController.promise,
  }
}
