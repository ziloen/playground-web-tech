type Range = { start: number; end: number }

/**
 * Escape dollars that @vscode/markdown-it-katex would NOT treat as math delimiters.
 *
 * Examples:
 *   Costs $19 today, then $29 next month.
 * -> Costs \$19 today, then \$29 next month.
 *
 *   Euler: $e^{i\pi}+1=0$.
 * -> unchanged
 *
 *   Block: $$x^2$$
 * -> unchanged
 */
export function escapeInvalidDollars(markdown: string): string {
  const protectedRanges = getProtectedCodeRanges(markdown)

  let out = ''
  let i = 0
  let rangeIndex = 0

  while (i < markdown.length) {
    // Preserve protected ranges verbatim.
    while (rangeIndex < protectedRanges.length && protectedRanges[rangeIndex].end <= i) {
      rangeIndex++
    }

    const protectedRange = protectedRanges[rangeIndex]
    if (protectedRange && i >= protectedRange.start && i < protectedRange.end) {
      out += markdown.slice(i, protectedRange.end)
      i = protectedRange.end
      continue
    }

    const ch = markdown[i]

    if (ch !== '$') {
      out += ch
      i++
      continue
    }

    // Already escaped dollar: keep as-is.
    if (isEscapedByOddBackslashes(markdown, i)) {
      out += '$'
      i++
      continue
    }

    // Try $$...$$ first.
    if (markdown.startsWith('$$', i)) {
      const opener = isValidBlockDelim(markdown, i)

      if (opener.can_open) {
        const close = findClosingBlockDelim(markdown, i + 2, protectedRanges)

        // @vscode/markdown-it-katex rejects empty $$$$.
        if (close !== -1 && close > i + 2) {
          out += markdown.slice(i, close + 2)
          i = close + 2
          continue
        }
      }

      // Not a valid $$ delimiter. Escape only the current $.
      // The next $ will be examined on the next loop.
      out += '\\$'
      i++
      continue
    }

    // Try $...$.
    const opener = isValidInlineDelim(markdown, i)

    if (opener.can_open) {
      const close = findFirstUnescapedDollar(markdown, i + 1, protectedRanges)

      // Source behavior: only the first unescaped $ candidate is checked.
      // If that candidate is not a valid closing delimiter, the opener is not math.
      if (close !== -1 && close > i + 1 && isValidInlineDelim(markdown, close).can_close) {
        out += markdown.slice(i, close + 1)
        i = close + 1
        continue
      }
    }

    // Not part of a valid math expression.
    out += '\\$'
    i++
  }

  return out
}

function isValidInlineDelim(src: string, pos: number): { can_open: boolean; can_close: boolean } {
  const char = src[pos]
  const prevChar = src[pos - 1]
  const nextChar = src[pos + 1]

  if (char !== '$') {
    return { can_open: false, can_close: false }
  }

  let canOpen = false
  let canClose = false

  // Mirrors @vscode/markdown-it-katex:
  // prev must not be "$" or "\" and must be absent, whitespace, or non-word.
  if (
    prevChar !== '$' &&
    prevChar !== '\\' &&
    (prevChar === undefined || isWhitespace(prevChar) || !isWordCharacterOrNumber(prevChar))
  ) {
    canOpen = true
  }

  // Mirrors source:
  // next must not be "$" and must be absent, whitespace, or non-word.
  if (
    nextChar !== '$' &&
    (nextChar === undefined || isWhitespace(nextChar) || !isWordCharacterOrNumber(nextChar))
  ) {
    canClose = true
  }

  return { can_open: canOpen, can_close: canClose }
}

function isValidBlockDelim(src: string, pos: number): { can_open: boolean; can_close: boolean } {
  const prevChar = src[pos - 1]
  const char = src[pos]
  const nextChar = src[pos + 1]
  const nextCharPlus1 = src[pos + 2]

  if (
    char === '$' &&
    prevChar !== '$' &&
    prevChar !== '\\' &&
    nextChar === '$' &&
    nextCharPlus1 !== '$'
  ) {
    return { can_open: true, can_close: true }
  }

  return { can_open: false, can_close: false }
}

function findFirstUnescapedDollar(src: string, from: number, protectedRanges: Range[]): number {
  for (let i = from; i < src.length; i++) {
    const protectedRange = rangeContaining(protectedRanges, i)
    if (protectedRange) {
      i = protectedRange.end - 1
      continue
    }

    if (src[i] === '$' && !isEscapedByOddBackslashes(src, i)) {
      return i
    }
  }

  return -1
}

function findClosingBlockDelim(src: string, from: number, protectedRanges: Range[]): number {
  for (let i = from; i < src.length - 1; i++) {
    const protectedRange = rangeContaining(protectedRanges, i)
    if (protectedRange) {
      i = protectedRange.end - 1
      continue
    }

    if (
      src.startsWith('$$', i) &&
      !isEscapedByOddBackslashes(src, i) &&
      isValidBlockDelim(src, i).can_close
    ) {
      return i
    }
  }

  return -1
}

function isEscapedByOddBackslashes(src: string, pos: number): boolean {
  let count = 0

  for (let i = pos - 1; i >= 0 && src[i] === '\\'; i--) {
    count++
  }

  return count % 2 === 1
}

function isWhitespace(char: string): boolean {
  return /^\s$/u.test(char)
}

function isWordCharacterOrNumber(char: string): boolean {
  // Same intent as source: /^[\w\d]$/u
  return /^[\w\d]$/u.test(char)
}

function rangeContaining(ranges: Range[], pos: number): Range | undefined {
  // Ranges are small in typical Markdown documents.
  // Replace with binary search if processing very large files.
  return ranges.find((range) => pos >= range.start && pos < range.end)
}

/**
 * Protect fenced code blocks and inline code spans from mutation.
 * This is safer for a preprocessor, though it is not a full Markdown parser.
 */
function getProtectedCodeRanges(src: string): Range[] {
  const fenced = getFencedCodeRanges(src)
  const inline = getInlineCodeRanges(src, fenced)

  return mergeRanges([...fenced, ...inline])
}

function getFencedCodeRanges(src: string): Range[] {
  const ranges: Range[] = []

  let lineStart = 0

  while (lineStart < src.length) {
    const lineEnd = findLineEnd(src, lineStart)
    const line = src.slice(lineStart, lineEnd)
    const open = line.match(/^ {0,3}(`{3,}|~{3,})/)

    if (!open) {
      lineStart = lineEnd + (src[lineEnd] === '\n' ? 1 : 0)
      continue
    }

    const fence = open[1]
    const fenceChar = fence[0]
    const fenceLength = fence.length

    let blockEnd = src.length
    let nextLineStart = lineEnd + (src[lineEnd] === '\n' ? 1 : 0)

    while (nextLineStart < src.length) {
      const nextLineEnd = findLineEnd(src, nextLineStart)
      const nextLine = src.slice(nextLineStart, nextLineEnd)

      const closePattern = new RegExp(`^(?: {0,3})\\${fenceChar}{${fenceLength},}\\s*$`)

      if (closePattern.test(nextLine)) {
        blockEnd = nextLineEnd + (src[nextLineEnd] === '\n' ? 1 : 0)
        break
      }

      nextLineStart = nextLineEnd + (src[nextLineEnd] === '\n' ? 1 : 0)
    }

    ranges.push({ start: lineStart, end: blockEnd })
    lineStart = blockEnd
  }

  return ranges
}

function getInlineCodeRanges(src: string, excludedRanges: Range[]): Range[] {
  const ranges: Range[] = []
  let i = 0

  while (i < src.length) {
    const excluded = rangeContaining(excludedRanges, i)
    if (excluded) {
      i = excluded.end
      continue
    }

    if (src[i] !== '`') {
      i++
      continue
    }

    const start = i
    const tickCount = countRun(src, i, '`')
    const needle = '`'.repeat(tickCount)

    i += tickCount

    const close = src.indexOf(needle, i)
    if (close === -1) {
      continue
    }

    ranges.push({ start, end: close + tickCount })
    i = close + tickCount
  }

  return ranges
}

function countRun(src: string, pos: number, char: string): number {
  let count = 0

  while (src[pos + count] === char) {
    count++
  }

  return count
}

function findLineEnd(src: string, start: number): number {
  const idx = src.indexOf('\n', start)
  return idx === -1 ? src.length : idx
}

function mergeRanges(ranges: Range[]): Range[] {
  const sorted = ranges.slice().sort((a, b) => a.start - b.start || a.end - b.end)

  const merged: Range[] = []

  for (const range of sorted) {
    const last = merged.at(-1)

    if (!last || range.start > last.end) {
      merged.push({ ...range })
    } else {
      last.end = Math.max(last.end, range.end)
    }
  }

  return merged
}
