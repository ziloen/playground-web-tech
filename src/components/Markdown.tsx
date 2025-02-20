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
import { visit } from 'unist-util-visit'

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
  code(props) {
    const inline = props.node!.properties!.inline as boolean
    const rawText = props.node!.properties!.text as string

    if (inline) {
      return <code className={props.className}>{props.children}</code>
    }

    return (
      <code className={clsx(props.className, '')}>
        {/* Header */}
        <div className="flex items-center bg-blue-800 px-4">
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
          {props.children}
        </div>
      </code>
    )
  },
}

function rehypePlugin() {
  return (tree: Node) => {
    // console.log('rehypePlugin', tree)
  }
}

function remarkPlugin() {
  return (tree: InlineCode | Code) => {
    visit(tree, ['inlineCode', 'code'], (node) => {
      node.data ??= {}
      node.data.hProperties ??= {}
      node.data.hProperties.inline = node.type === 'inlineCode'
      node.data.hProperties.text = node.value
    })
  }
}
