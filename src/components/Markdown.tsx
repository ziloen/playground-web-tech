import '@fontsource-variable/fira-code'
import '@fontsource-variable/noto-sans-sc'

import './markdown.css'

import ReactMarkdown from 'react-markdown'
import type { Options as HighlightOptions } from 'rehype-highlight'
import rehypeHighlight from 'rehype-highlight'
import type { Options as KatexOptions } from 'rehype-katex'
import rehypeKatex from 'rehype-katex'
import type { Options as RemarkGfmOptions } from 'remark-gfm'
import remarkGfm from 'remark-gfm'
import type { Options as RemarkMathOptions } from 'remark-math'
import remarkMath from 'remark-math'

// TODO: fix url space issue, e.g. [link](https://example.com/with space)

// https://github.com/remarkjs/remark-math/issues/39
// TODO: make `\[` and `\]` work for block math
// TODO: make `\(` and `\)` work for inline math

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      rehypePlugins={[
        [rehypeHighlight, {
          detect: true,
        } as HighlightOptions],
        [rehypeKatex, {
          errorColor: '',
        } as KatexOptions],
      ]}
      remarkPlugins={[
        [remarkGfm, {} as RemarkGfmOptions],
        [remarkMath, {} as RemarkMathOptions],
      ]}
    >
      {children}
    </ReactMarkdown>
  )
}
