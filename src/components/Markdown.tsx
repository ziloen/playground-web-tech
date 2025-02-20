import '@fontsource-variable/fira-code'
import '@fontsource-variable/noto-sans-sc'

import './markdown.css'

import type { Node, Root } from 'hast'
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

    console.log('code', { inline, rawText })

    return <code className={props.className}>{props.children}</code>
  },
}

function rehypePlugin() {
  return (tree: Node) => {
    // console.log('rehypePlugin', tree)
  }
}

function remarkPlugin() {
  return (tree: Node) => {
    visit(tree, ['inlineCode', 'code'], (node) => {
      node.data ??= {}
      // @ts-expect-error data is any
      node.data.hProperties ??= {}
      // @ts-expect-error data is any
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      node.data.hProperties.inline = node.type === 'inlineCode'
      // @ts-expect-error value is any
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      node.data.hProperties.text = node.value
    })
  }
}
