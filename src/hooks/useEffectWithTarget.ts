// https://github.com/alibaba/hooks/blob/master/packages/hooks/src/utils/useEffectWithTarget.ts

import { isFunction } from 'lodash-es'
import type { DependencyList, EffectCallback, RefObject } from 'react'
import { useEffect, useRef } from 'react'

export function useEffectWithTarget(
  effect: EffectCallback,
  deps: DependencyList,
  target: BasicTarget<TargetType> | BasicTarget<TargetType>[],
) {
  const hasInitRef = useRef(false)

  const lastElementRef = useRef<(TargetType | null | undefined)[]>([])
  const lastDepsRef = useRef<DependencyList>([])

  const unLoadRef = useRef<undefined | (() => any) | void>(undefined)

  useEffect(() => {
    const targets = Array.isArray(target) ? target : [target]
    const els = targets.map((item) => getTargetElement(item))

    // init run
    if (!hasInitRef.current) {
      hasInitRef.current = true
      lastElementRef.current = els
      lastDepsRef.current = deps

      unLoadRef.current = effect()
      return
    }

    if (
      els.length !== lastElementRef.current.length
      || !depsAreSame(lastElementRef.current, els)
      || !depsAreSame(lastDepsRef.current, deps)
    ) {
      unLoadRef.current?.()

      lastElementRef.current = els
      lastDepsRef.current = deps
      unLoadRef.current = effect()
    }
  })

  useEffect(() => {
    return () => {
      unLoadRef.current?.()
      // for react-refresh
      hasInitRef.current = false
    }
  }, [])
}

type TargetValue<T> = T | undefined | null

type TargetType = HTMLElement | Element | Window | Document

export type BasicTarget<T extends TargetType = Element> =
  | (() => TargetValue<T>)
  | TargetValue<T>
  | RefObject<TargetValue<T>>

export function getTargetElement<T extends TargetType>(
  target: BasicTarget<T>,
  defaultElement?: T,
): TargetValue<T> {
  if (!target) {
    return defaultElement
  }

  let targetElement: TargetValue<T>

  if (isFunction(target)) {
    targetElement = target()
  } else if ('current' in target) {
    targetElement = target.current
  } else {
    targetElement = target
  }

  return targetElement
}

function depsAreSame(oldDeps: DependencyList, deps: DependencyList): boolean {
  if (oldDeps === deps) return true
  for (let i = 0; i < oldDeps.length; i++) {
    if (!Object.is(oldDeps[i], deps[i])) return false
  }
  return true
}
