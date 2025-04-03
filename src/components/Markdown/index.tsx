import '@fontsource-variable/fira-code'
import '@fontsource-variable/noto-sans-sc'

import './markdown.css'

import type { Element as HastElement, Nodes as HastNodes } from 'hast'
import type { Nodes as MdastNodes } from 'mdast'
import type { Components as MarkdownComponents } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import type { PluggableList, Plugin } from 'unified'
import { CONTINUE, EXIT, SKIP, visit } from 'unist-util-visit'
import type { VFile } from 'vfile'

// TODO: fix url space issue, e.g. [link](https://example.com/with space)

// https://github.com/remarkjs/remark-math/issues/39
// TODO: make `\[` and `\]` work for block math
// TODO: make `\(` and `\)` work for inline math

// TODO: custom footnote style [^1](https://example.com)

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      rehypePlugins={rehypePlugins}
      remarkPlugins={remarkPlugins}
      components={components as MarkdownComponents}
      remarkRehypeOptions={{
        footnoteBackContent: null,
      }}
    >
      {children}
    </ReactMarkdown>
  )
}

type Components = {
  [Key in keyof React.JSX.IntrinsicElements]?:
    | React.ComponentType<React.JSX.IntrinsicElements[Key] & { node: HastElement }>
    | keyof React.JSX.IntrinsicElements
}

const components: Components = {
  code({ node, className, children }) {
    const inline = node.properties.inline as boolean
    const rawText = node.properties.text as string
    const language = node.properties.language as string | null

    if (inline) {
      return <code className={className}>{children}</code>
    }

    return (
      <code className={className}>
        {/* Header */}
        <div className="flex items-center bg-blue-800 px-4">
          <span>{language}</span>

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
  table({ children, node }) {
    return (
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-max max-h-full tabular-nums">
          {children}
        </table>
      </div>
    )
  },
  a({ children, className, href, node, ...rest }) {
    return (
      <a className={className} href={href} {...rest}>
        {children}
      </a>
    )
  },
}

const rehypePlugins = pluginList([
  [rehypeHighlight, {}],
  [rehypeKatex, { errorColor: '' }],
  [rehypePlugin],
])

const remarkPlugins = pluginList([
  [remarkGfm, {}],
  [remarkMath, {}],
  [remarkPlugin],
])

/*#__NO_SIDE_EFFECTS__*/
function pluginList<
  const T extends Plugin<any[], any, any>[],
>(plugins: { [K in (keyof T)]: [T[K], ...Parameters<NoInfer<T>[K]>] }): PluggableList {
  return plugins
}

function rehypePlugin() {
  return (tree: HastNodes, file: VFile) => {
    console.log('rehypePlugin', structuredClone(tree))

    visit(tree, (node, index, parent) => {
      // Add `codeBlock` to `pre` node
      if (
        node.type === 'element'
        && node.tagName === 'code'
        && parent
        && parent.type === 'element'
        && parent.tagName === 'pre'
      ) {
        parent.properties ??= {}
      }
    })
  }
}

function remarkPlugin() {
  return (tree: MdastNodes, file: VFile) => {
    console.log('remarkPlugin', structuredClone(tree))

    visit(tree, (node, index, parent) => {
      // Add `iniline` / `text` / `language` to code node
      if (node.type === 'code' || node.type === 'inlineCode') {
        node.data ??= {}
        node.data.hProperties ??= {}
        node.data.hProperties.inline = node.type === 'inlineCode'
        node.data.hProperties.text = node.value
        node.data.hProperties.language = node.type === 'code' ? node.lang : null
      }

      if (node.type === 'table') {
      }
    })
  }
}
