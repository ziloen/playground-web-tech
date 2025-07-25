import { fetchAsDataURL } from './dataurl'
import { embedResources, shouldEmbed } from './embed-resources'
import type { Options } from './types'
import { toArray } from './util'

interface Metadata {
  url: string
  cssText: string
}

const cssFetchCache: { [href: string]: Metadata } = {}

async function fetchCSS(url: string) {
  let cache = cssFetchCache[url]
  if (cache != null) {
    return cache
  }

  const res = await fetch(url)
  const cssText = await res.text()
  cache = { url, cssText }

  cssFetchCache[url] = cache

  return cache
}

async function embedFonts(data: Metadata, options: Options): Promise<string> {
  let cssText = data.cssText
  const regexUrl = /url\(["']?([^"')]+)["']?\)/g
  const fontLocs = cssText.match(/url\([^)]+\)/g) ?? []
  const loadFonts = fontLocs.map(async (loc: string) => {
    let url = loc.replace(regexUrl, '$1')
    if (!url.startsWith('https://')) {
      url = new URL(url, data.url).href
    }

    return fetchAsDataURL<[string, string]>(url, options.fetchRequestInit, ({ result }) => {
      cssText = cssText.replace(loc, `url(${result})`)
      return [loc, result]
    })
  })

  return Promise.all(loadFonts).then(() => cssText)
}

function parseCSS(source: string) {
  if (source == null) {
    return []
  }

  const result: string[] = []
  const commentsRegex = /(?:\/\*[\s\S]*?\*\/)/gi
  // strip out comments
  let cssText = source.replace(commentsRegex, '')

  const keyframesRegex = new RegExp(String.raw`((@.*?keyframes [\s\S]*?){([\s\S]*?}\s*?)})`, 'gi')

  while (true) {
    const matches = keyframesRegex.exec(cssText)
    if (matches === null) {
      break
    }
    result.push(matches[0])
  }
  cssText = cssText.replace(keyframesRegex, '')

  const importRegex = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi
  // to match css & media queries together
  const combinedCSSRegex = String.raw`((\s*?(?:\/\*[\s\S]*?\*\/)?\s*?@media[\s\S]`
    + String.raw`*?){([\s\S]*?)}\s*?})|(([\s\S]*?){([\s\S]*?)})`
  // unified regex
  const unifiedRegex = new RegExp(combinedCSSRegex, 'gi')

  while (true) {
    let matches = importRegex.exec(cssText)
    if (matches === null) {
      matches = unifiedRegex.exec(cssText)
      if (matches === null) {
        break
      } else {
        importRegex.lastIndex = unifiedRegex.lastIndex
      }
    } else {
      unifiedRegex.lastIndex = importRegex.lastIndex
    }
    result.push(matches[0])
  }

  return result
}

async function getCSSRules(
  styleSheets: CSSStyleSheet[],
  options: Options,
): Promise<CSSStyleRule[]> {
  const ret: CSSStyleRule[] = []
  const deferreds: Promise<number | void>[] = []

  // First loop inlines imports
  styleSheets.forEach((sheet) => {
    if ('cssRules' in sheet) {
      try {
        toArray<CSSRule>(sheet.cssRules || []).forEach((item, index) => {
          if (item.type === CSSRule.IMPORT_RULE) {
            let importIndex = index + 1
            const url = (item as CSSImportRule).href
            const deferred = fetchCSS(url)
              .then((metadata) => embedFonts(metadata, options))
              .then((cssText) =>
                parseCSS(cssText).forEach((rule) => {
                  try {
                    sheet.insertRule(
                      rule,
                      rule.startsWith('@import') ? (importIndex += 1) : sheet.cssRules.length,
                    )
                  } catch (error: unknown) {
                    console.error('Error inserting rule from remote css', { rule, error })
                  }
                })
              )
              .catch((e: unknown) => {
                console.error(
                  'Error loading remote css',
                  e instanceof Error ? e.toString() : String(e),
                )
              })

            deferreds.push(deferred)
          }
        })
      } catch (e) {
        const inline = styleSheets.find((a) => a.href == null) ?? document.styleSheets[0]
        if (sheet.href != null) {
          deferreds.push(
            fetchCSS(sheet.href)
              .then((metadata) => embedFonts(metadata, options))
              .then((cssText) =>
                parseCSS(cssText).forEach((rule) => {
                  inline.insertRule(rule, inline.cssRules.length)
                })
              )
              .catch((err: unknown) => {
                console.error('Error loading remote stylesheet', err)
              }),
          )
        }
        console.error('Error inlining remote css file', e)
      }
    }
  })

  return Promise.all(deferreds).then(() => {
    // Second loop parses rules
    styleSheets.forEach((sheet) => {
      if ('cssRules' in sheet) {
        try {
          toArray<CSSStyleRule>(sheet.cssRules || []).forEach((item) => {
            ret.push(item)
          })
        } catch (e) {
          console.error(`Error while reading CSS rules from ${sheet.href ?? ''}`, e)
        }
      }
    })

    return ret
  })
}

function getWebFontRules(cssRules: CSSStyleRule[]): CSSStyleRule[] {
  return cssRules
    .filter((rule) => rule.type === CSSRule.FONT_FACE_RULE)
    .filter((rule) => shouldEmbed(rule.style.getPropertyValue('src')))
}

async function parseWebFontRules(node: HTMLElement, options: Options) {
  if (node.ownerDocument == null) {
    throw new Error('Provided element is not within a Document')
  }

  let styleSheets
  const rootNode = node.getRootNode({ composed: false })

  if (rootNode instanceof ShadowRoot) {
    styleSheets = toArray<CSSStyleSheet>(rootNode.styleSheets)
  } else {
    styleSheets = toArray<CSSStyleSheet>(node.ownerDocument.styleSheets)
  }

  const cssRules = await getCSSRules(styleSheets, options)

  return getWebFontRules(cssRules)
}

export async function getWebFontCSS(
  node: HTMLElement,
  options: Options,
): Promise<string> {
  const rules = await parseWebFontRules(node, options)
  const cssTexts = await Promise.all(
    rules.map((rule) => {
      const baseUrl = rule.parentStyleSheet ? rule.parentStyleSheet.href : null
      return embedResources(rule.cssText, baseUrl, options)
    }),
  )

  return cssTexts.join('\n')
}

export async function embedWebFonts<T extends HTMLElement>(
  clonedNode: T,
  options: Options,
) {
  const cssText = options.fontEmbedCSS
    ?? (options.skipFonts ? null : await getWebFontCSS(clonedNode, options))

  if (cssText) {
    const styleNode = document.createElement('style')
    const sytleContent = document.createTextNode(cssText)

    styleNode.append(sytleContent)

    if (clonedNode.firstChild) {
      clonedNode.insertBefore(styleNode, clonedNode.firstChild)
    } else {
      clonedNode.append(styleNode)
    }
  }
}
