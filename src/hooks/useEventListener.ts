import { useEventListener as ahookUseEventListener } from 'ahooks'
import { Target } from 'ahooks/lib/useEventListener'
import { BasicTarget } from 'ahooks/lib/utils/domTarget'

type noop = (...p: any) => void

type Options<T extends HTMLElement | Element | Window | Document = HTMLElement | Element | Window | Document> = {
  target?: (() => T) | React.MutableRefObject<T | null | undefined> | T | null | undefined
  capture?: boolean
  once?: boolean
  passive?: boolean
}

export const useEventListener = ahookUseEventListener as {
  <K extends keyof HTMLElementEventMap>(eventName: K, handler: (ev: HTMLElementEventMap[K]) => void, options?: Options<HTMLElement>): void
  <K extends keyof ElementEventMap>(eventName: K, handler: (ev: ElementEventMap[K]) => void, options?: Options<Element>): void
  <K extends keyof DocumentEventMap, T extends BasicTarget<Document>>(eventName: K, handler: (ev: DocumentEventMap[K]) => void, options?: Options<Document>): void
  <K extends keyof WindowEventMap, T extends BasicTarget<Window>>(eventName: K, handler: (ev: WindowEventMap[K]) => void, options?: Options<Window>): void
  (eventName: string, handler: noop, options: Options): void
}