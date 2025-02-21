import '@fontsource-variable/fira-code'
import '@fontsource-variable/noto-sans-sc'

import './markdown.css'

import type { Code, InlineCode, Node } from 'mdast'
import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import type { Options as HighlightOptions } from 'rehype-highlight'
import rehypeHighlight from 'rehype-highlight'
import type { Options as KatexOptions } from 'rehype-katex'
import rehypeKatex from 'rehype-katex'
import type { Options as RemarkGfmOptions } from 'remark-gfm'
import remarkGfm from 'remark-gfm'
import type { Options as RemarkMathOptions } from 'remark-math'
import remarkMath from 'remark-math'
import { CONTINUE, EXIT, SKIP, visit } from 'unist-util-visit'
import type { VFile } from 'vfile'

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
        [rehypePlugin],
      ]}
      remarkPlugins={[
        [remarkGfm, {} as RemarkGfmOptions],
        [remarkMath, {} as RemarkMathOptions],
        [remarkPlugin],
      ]}
      components={components}
    >
      {children}
    </ReactMarkdown>
  )
}

const components: Components = {
  code({ node, className, children }) {
    const inline = node!.properties!.inline as boolean
    const rawText = node!.properties!.text as string
    const language = node!.properties!.language as string | null

    if (inline) {
      return <code className={className}>{children}</code>
    }

    return (
      <code className={className}>
        {/* Header */}
        <div className="flex items-center bg-blue-800 px-4">
          <span className="">{language}</span>

          <button
            className="ms-auto"
            onClick={() => {
              navigator.clipboard.writeText(rawText)
            }}
          >
            Copy
          </button>
        </div>

        <div className="overflow-x-auto px-2 pb-2 pt-1 scrollbar-thin">
          {children}
        </div>
      </code>
    )
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-max max-h-full tabular-nums">
          {children}
        </table>
      </div>
    )
  },
}

function rehypePlugin() {
  return (tree: Node, file: VFile) => {
    // console.log('rehypePlugin', tree)
  }
}

function remarkPlugin() {
  return (tree: Node, file: VFile) => {
    // console.log('remarkPlugin', tree)

    visit(tree, (node, index, parent) => {
      // console.log('link', structuredClone(node))
    })

    visit(tree as InlineCode | Code, ['inlineCode', 'code'], (node, index, parent) => {
      node.data ??= {}
      node.data.hProperties ??= {}
      node.data.hProperties.inline = node.type === 'inlineCode'
      node.data.hProperties.text = node.value
      node.data.hProperties.language = node.type === 'code' ? node.lang : null
    })
  }
}
