import { useEventListener as ahookUseEventListener } from 'ahooks'
import { BasicTarget } from 'ahooks/lib/utils/domTarget'

type noop = (...p: any) => void

type Options<T extends HTMLElement | Element | Window | Document = HTMLElement | Element | Window | Document> = {
  target?: BasicTarget<T>
  capture?: boolean
  once?: boolean
  passive?: boolean
}

export const useEventListener = ahookUseEventListener as {
  <K extends keyof HTMLElementEventMap>(eventName: K, handler: (ev: HTMLElementEventMap[K]) => void, options?: Options<HTMLElement>): void
  <K extends keyof ElementEventMap>(eventName: K, handler: (ev: ElementEventMap[K]) => void, options?: Options<Element>): void
  <K extends keyof DocumentEventMap>(eventName: K, handler: (ev: DocumentEventMap[K]) => void, options?: Options<Document>): void
  <K extends keyof WindowEventMap>(eventName: K, handler: (ev: WindowEventMap[K]) => void, options?: Options<Window>): void
  (eventName: string, handler: noop, options: Options): void
}