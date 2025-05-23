import '@fontsource-variable/fira-code'
import '@fontsource-variable/noto-sans-sc'

import './markdown.css'

import { ChevronDownIcon } from '@primer/octicons-react'
import type { Element as HastElement, Nodes as HastNodes } from 'hast'
import type { Nodes as MdastNodes } from 'mdast'
import type { Components as MarkdownComponents } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import remarkGfmNoAutoLink from 'remark-gfm-no-autolink'
import remarkMath from 'remark-math'
import type { PluggableList, Plugin, Processor } from 'unified'
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

type Components =
  & {
    [Key in keyof React.JSX.IntrinsicElements]?:
      | React.ComponentType<React.JSX.IntrinsicElements[Key] & { node: HastElement }>
      | keyof React.JSX.IntrinsicElements
  }
  & {
    think?: React.ComponentType<React.ComponentProps<'div'> & { node: HastElement }>
  }

const components: Components = {
  code({ node, className, children }) {
    console.log('code', node)
    const inline = node.properties.inline as 'true' | 'false' | undefined
    const rawText = node.properties.text as string
    const language = node.properties.language as string | null

    if (inline === 'true') {
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
      <a
        className={className}
        target="_blank"
        rel="noreferrer"
        href={href}
        {...rest}
      >
        {children}
      </a>
    )
  },
  think({ children }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
      <div
        className="grid transition-all duration-100"
        style={{
          gridTemplateRows: isOpen ? 'auto 1fr' : 'auto 0fr',
        }}
      >
        <div
          className={clsx(
            'flex items-center gap-1 cursor-pointer w-fit select-none',
            isOpen ? 'text-light-gray-300' : 'text-light-gray-900 hover:text-light-gray-300',
          )}
          onClick={() => {
            setIsOpen((prev) => !prev)
          }}
        >
          <span className="text-sm">
            Thought process
          </span>
          <ChevronDownIcon size={10} />
        </div>

        <div
          className={clsx(
            'overflow-clip min-h-0 transition-opacity duration-100',
            isOpen ? 'opacity-100' : 'opacity-0',
          )}
        >
          <div className="border-s-2 border-0 border-solid border-s-dark-gray-200 ps-2 mt-2 text-light-gray-600 leading-relaxed text-sm ms-0.5">
            {children}
          </div>
        </div>
      </div>
    )
  },
}

const rehypePlugins = pluginList([
  [rehypeHighlight, {}],
  [rehypeKatex, { errorColor: '' }],
  [rehypePlugin],
  [rehypeRaw],
])

const remarkPlugins = pluginList([
  [remarkGfmNoAutoLink, {}],
  [remarkMath, {}],
  [remarkPlugin],
])

/*#__NO_SIDE_EFFECTS__*/
function pluginList<
  const T extends Plugin<any[], any, any>[],
>(plugins: { [K in (keyof T)]: [T[K], ...Parameters<NoInfer<T>[K]>] }): PluggableList {
  return plugins
}

function rehypePlugin(this: Processor) {
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

function remarkPlugin(this: Processor) {
  // disable `indentedCode` in micromark
  // https://github.com/micromark/micromark#case-turn-off-constructs
  // https://github.com/zestedesavoir/zmarkdown/issues/416#issuecomment-982812961
  // https://github.com/micromark/micromark/tree/main/packages/micromark-core-commonmark#api
  const data = this.data()
  const list = (data.micromarkExtensions ??= [])
  list.push({ disable: { null: ['codeIndented'] } })

  return (tree: MdastNodes, file: VFile) => {
    console.log('remarkPlugin', structuredClone(tree))

    visit(tree, (node, index, parent) => {
      // Add `iniline` / `text` / `language` to code node
      if (node.type === 'code' || node.type === 'inlineCode') {
        node.data ??= {}
        node.data.hProperties ??= {}
        // FIXME: this is a hack to make `rehypeRaw` work
        // `rehypeRaw` will remove `inline` and `text` properties
        node.data.hProperties.inline = node.type === 'inlineCode' ? 'true' : 'false'
        node.data.hProperties.text = node.value
        node.data.hProperties.language = node.type === 'code' ? node.lang : null
      }

      if (node.type === 'table') {
      }
    })
  }
}
