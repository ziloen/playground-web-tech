import OneDarkPro from './OneDark-Pro-night-flat.json'

import { languageAliasNames, languageNames } from '@shikijs/langs-precompiled'
import { CodeToTokenTransformStream } from '@shikijs/stream'
import {
  memo,
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { HighlighterCore, LanguageRegistration, ThemedToken, ThemeInput } from 'shiki/core'
import { createHighlighterCore, getTokenStyleObject } from 'shiki/core'
import { createJavaScriptRawEngine } from 'shiki/engine/javascript'
import { useMemoizedFn } from '~/hooks'
import { intersperse } from '~/utils'

let cachedHighlighter: HighlighterCore | null = null
let initPromise: Promise<HighlighterCore> | null = null

async function initHighlighter() {
  if (cachedHighlighter) return cachedHighlighter
  if (initPromise) return initPromise

  initPromise = createHighlighterCore({
    themes: [OneDarkPro as unknown as ThemeInput],
    langs: [],
    engine: createJavaScriptRawEngine(),
  }).then((h) => {
    cachedHighlighter = h
    initPromise = null
    return h
  })

  return initPromise
}

async function getLanguageLoadedHighlighter(lang: string): Promise<HighlighterCore> {
  const highlighter = await initHighlighter()

  return loadLanguage(highlighter, lang)
}

const loadingLanguages = new Map<string, Promise<HighlighterCore>>()

async function loadLanguage(highlighter: HighlighterCore, lang: string): Promise<HighlighterCore> {
  if (loadingLanguages.has(lang)) {
    return loadingLanguages.get(lang)!
  }

  if (highlighter.getLoadedLanguages().includes(lang)) return highlighter

  const promise = import(`../../../node_modules/@shikijs/langs-precompiled/dist/${lang}.mjs`)
    .then((langMod: LanguageRegistration) => highlighter.loadLanguage(langMod))
    .then(() => highlighter)
    .finally(() => loadingLanguages.delete(lang))

  loadingLanguages.set(lang, promise)

  return promise
}

export const CodeHighlighter = memo(function CodeHighlighter({
  code,
  language,
}: {
  code: string
  language: string | null
}) {
  const lang = useMemo(() => {
    if (!language) return null
    if (languageNames.includes(language) || languageAliasNames.includes(language)) {
      return language
    } else {
      return null
    }
  }, [language])

  const [highlighter, setHighlighter] = useState<HighlighterCore | null>(null)

  useEffect(() => {
    if (lang) {
      getLanguageLoadedHighlighter(lang).then((highlighter) => {
        startTransition(() => {
          setHighlighter(highlighter)
        })
      })
    }
  }, [lang])

  const deferredCode = useDeferredValue(code)

  return useMemo(() => {
    if (!highlighter) return deferredCode

    return intersperse(
      highlighter
        .codeToTokens(deferredCode, {
          theme: 'One Dark Pro',
          lang: lang ?? 'text',
        })
        .tokens.map((tokens, i) =>
          tokens.map((token, j) => (
            <span key={`${i}-${j}`} style={token.htmlStyle ?? getTokenStyleObject(token)}>
              {token.content}
            </span>
          )),
        ),
      '\n',
    )
  }, [highlighter, deferredCode, lang])
})

export const StreamingCodeHighlighter = memo(function StreamingCodeHighlighter({
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
      const highlighter = cachedHighlighter ?? (await initHighlighter())

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
              startTransition(() => {
                if ('recall' in token) {
                  setTokens((tokens) => tokens.slice(0, -token.recall))
                } else {
                  setTokens((tokens) => [...tokens, token])
                }
              })
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
