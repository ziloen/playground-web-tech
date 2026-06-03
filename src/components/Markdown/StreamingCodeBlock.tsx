import OneDarkPro from './OneDark-Pro-night-flat.json'

import { languageAliasNames, languageNames } from '@shikijs/langs-precompiled'
import { CodeToTokenTransformStream } from '@shikijs/stream'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import type { HighlighterCore, LanguageRegistration, ThemedToken, ThemeInput } from 'shiki/core'
import { createHighlighterCore, getTokenStyleObject } from 'shiki/core'
import { createJavaScriptRawEngine } from 'shiki/engine/javascript'
import { useMemoizedFn } from '~/hooks'

let highlighter: HighlighterCore | null = null
let initPromise: Promise<HighlighterCore> | null = null

async function initHighlighter() {
  if (highlighter) return highlighter
  if (initPromise) return initPromise

  initPromise = createHighlighterCore({
    themes: [OneDarkPro as unknown as ThemeInput],
    langs: [],
    engine: createJavaScriptRawEngine(),
  }).then((h) => {
    highlighter = h
    initPromise = null
    return h
  })

  return initPromise
}

const loadingLanguages = new Map<string, Promise<void>>()

async function loadLanguage(highlighter: HighlighterCore, lang: string) {
  if (highlighter.getLoadedLanguages().includes(lang)) return

  if (loadingLanguages.has(lang)) {
    return loadingLanguages.get(lang)!
  }

  const promise = import(`../../../node_modules/@shikijs/langs-precompiled/dist/${lang}.mjs`)
    .then((langModule: LanguageRegistration) => highlighter.loadLanguage(langModule))
    .finally(() => loadingLanguages.delete(lang))

  loadingLanguages.set(lang, promise)

  return promise
}

export const StreamingCodeBlock = memo(function StreamingCodeBlock({
  code,
  language,
}: {
  code: string
  language: string | null
}) {
  const [tokens, setTokens] = useState<ThemedToken[]>([])

  const controllerRef = useRef<ReadableStreamDefaultController<string> | null>(null)
  const indexRef = useRef(0)

  const lang = useMemo(() => {
    if (!language) return null
    if (languageNames.includes(language) || languageAliasNames.includes(language)) {
      return language
    } else {
      return null
    }
  }, [language])

  // FIXME: 如果 code 不是增加而是减少，会导致不更新或者错误
  const enqueue = useMemoizedFn(() => {
    if (!controllerRef.current) return
    if (code.length <= indexRef.current) return

    controllerRef.current.enqueue(code.slice(indexRef.current))
    indexRef.current = code.length
  })

  useEffect(() => {
    let canceled = false

    ;(async () => {
      const highlighter = await initHighlighter()

      // FIXME: lang 变化时需要重新触发 load language
      // FIXME: 可能需要 dispose？
      // FIXME: auto detect language

      if (lang) {
        await loadLanguage(highlighter, lang)
      }

      if (canceled) return

      const textStream = new ReadableStream<string>({
        start(_controller) {
          controllerRef.current = _controller
          enqueue()
        },
      })

      textStream
        .pipeThrough(
          new CodeToTokenTransformStream({
            highlighter,
            theme: 'One Dark Pro',
            lang: lang ?? 'text',
            allowRecalls: true,
          }),
        )
        .pipeTo(
          new WritableStream({
            write(token) {
              if ('recall' in token) {
                setTokens((tokens) => tokens.slice(0, -token.recall))
              } else {
                setTokens((tokens) => [...tokens, token])
              }
            },
          }),
        )
    })()

    return () => {
      canceled = true
      controllerRef.current?.close()
      controllerRef.current = null
      indexRef.current = 0
    }
  }, [lang])

  useEffect(() => {
    enqueue()
  }, [code])

  if (tokens.length === 0) {
    return code
  }

  return tokens.map((token, i) => (
    <span key={i} style={token.htmlStyle ?? getTokenStyleObject(token)}>
      {token.content}
    </span>
  ))
})
