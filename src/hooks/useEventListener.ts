import type { BasicTarget } from './useEffectWithTarget'
import { getTargetElement, useEffectWithTarget } from './useEffectWithTarget'
import { useLatest } from './useLatest'

type noop = (...p: any) => void

type Options<
  T extends HTMLElement | Element | Window | Document = HTMLElement | Element | Window | Document,
> = {
  target?: BasicTarget<T>
  capture?: boolean
  once?: boolean
  passive?: boolean
}

export const useEventListener = ((eventName: string, handler: noop, options: Options = {}) => {
  const handlerRef = useLatest(handler)

  useEffectWithTarget(
    () => {
      const targetElement = getTargetElement(options.target, window)
      if (!targetElement?.addEventListener) {
        return
      }

      const eventListener = (event: Event) => {
        return handlerRef.current(event)
      }

      targetElement.addEventListener(eventName, eventListener, {
        capture: options.capture,
        once: options.once,
        passive: options.passive,
      })

      return () => {
        targetElement.removeEventListener(eventName, eventListener, {
          capture: options.capture,
        })
      }
    },
    [eventName, options.capture, options.once, options.passive],
    options.target,
  )
}) as {
  <K extends keyof HTMLElementEventMap>(
    eventName: K,
    handler: (ev: HTMLElementEventMap[K]) => void,
    options?: Options<HTMLElement>,
  ): void
  <K extends keyof ElementEventMap>(
    eventName: K,
    handler: (ev: ElementEventMap[K]) => void,
    options?: Options<Element>,
  ): void
  <K extends keyof DocumentEventMap>(
    eventName: K,
    handler: (ev: DocumentEventMap[K]) => void,
    options?: Options<Document>,
  ): void
  <K extends keyof WindowEventMap>(
    eventName: K,
    handler: (ev: WindowEventMap[K]) => void,
    options?: Options<Window>,
  ): void
  (eventName: string, handler: noop, options: Options): void
}
