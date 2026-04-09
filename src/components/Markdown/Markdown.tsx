import '@fontsource-variable/fira-code/index.css'
import '@fontsource-variable/noto-sans-sc/index.css'
import 'katex/dist/katex.css'
import './markdown.css'

import clsx from 'clsx/lite'
import type { Element as HastElement, Nodes as HastNodes } from 'hast'
import type { Nodes as MdastNodes } from 'mdast'
import { useState } from 'react'
import type { Components as MarkdownComponents } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import remarkGfmNoAutoLink from 'remark-gfm-no-autolink'
import remarkMath from 'remark-math'
import type { PluggableList, Plugin, Processor } from 'unified'
import { visit } from 'unist-util-visit'
import type { VFile } from 'vfile'
import { useAutoResetState } from '~/hooks'
import { cn } from '~/utils'
import CarbonCheckmark from '~icons/carbon/checkmark'
import CarbonCopy from '~icons/carbon/copy'
import OcticonChevronDown12 from '~icons/octicon/chevron-down-12'

// TODO: fix url space issue, e.g. [link](https://example.com/with space)

// https://github.com/remarkjs/remark-math/issues/39
// TODO: make `\[` and `\]` work for block math
// TODO: make `\(` and `\)` work for inline math

// TODO: custom footnote style [^1](https://example.com)

// TODO: stabilize render when streaming input

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
} & {
  think?: React.ComponentType<React.ComponentProps<'div'> & { node: HastElement }>
}

const components: Components = {
  code({ node, className, children }) {
    const inline = node.properties.inline as 'true' | 'false' | undefined
    const rawText = node.properties.text as string
    const language = node.properties.language as string | null
    const [copied, setCopied] = useAutoResetState(false, 2_000)

    if (inline === 'true') {
      return <code className={className}>{children}</code>
    }

    return (
      <code className={cn('grid overflow-clip', className)}>
        {/* Header */}
        <div className="gap-2 px-4 py-1 area-[1/1]">
          <span>{language}</span>
        </div>

        {/* 为使 sticky 生效，须要将 sticky 元素提升到 snap 容器的直接子元素 */}
        <div className="@container-[scroll-state] sticky top-2 bottom-2 justify-self-end bg-inherit area-[1/1]">
          <button
            className="my-1 me-2 flex size-fit rounded-md border-none bg-transparent p-1 @stuck-top:shadow-md"
            title="Copy code"
            aria-label="Copy code"
            onClick={() => {
              navigator.clipboard.writeText(rawText).then(() => {
                setCopied(true)
              })
            }}
          >
            {copied ? (
              <CarbonCheckmark width={14} height={14} />
            ) : (
              <CarbonCopy width={14} height={14} />
            )}
          </button>
        </div>

        <div className="overflow-x-auto overflow-y-clip px-4 pb-3 scrollbar-thin">{children}</div>
      </code>
    )
  },
  table({ children, node }) {
    return (
      <div className="overflow-x-auto scrollbar-thin">
        <table className="max-h-full w-max tabular-nums">{children}</table>
      </div>
    )
  },
  a({ children, className, href, node, ...rest }) {
    return (
      <a className={className} target="_blank" rel="noreferrer" href={href} {...rest}>
        {children}
      </a>
    )
  },
  think({ children }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
      <div
        className="grid transition-[grid-template-rows] duration-150"
        style={{
          gridTemplateRows: isOpen ? 'max-content 1fr' : 'max-content 0fr',
        }}
      >
        <div
          className={clsx(
            'flex w-fit cursor-pointer items-center gap-1 select-none',
            isOpen ? 'text-light-gray-300' : 'text-light-gray-900 hover:text-light-gray-300',
          )}
          onClick={() => {
            setIsOpen((prev) => !prev)
          }}
        >
          <span className="text-sm">Thought process</span>
          <OcticonChevronDown12 width={10} height={10} />
        </div>

        <div
          className={clsx(
            'overflow-hidden transition-opacity duration-150',
            isOpen ? 'opacity-100' : 'opacity-0',
          )}
        >
          <div className="mt-2 grid grid-flow-col">
            <div
              className="box-content h-full w-0.5 cursor-pointer self-stretch bg-dark-gray-200 bg-clip-content ps-0.5 pe-2"
              onClick={() => {
                setIsOpen(false)
              }}
            />

            <div className="text-sm leading-relaxed text-light-gray-600">{children}</div>
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

const remarkPlugins = pluginList([[remarkGfmNoAutoLink, {}], [remarkMath, {}], [remarkPlugin]])

/*#__NO_SIDE_EFFECTS__*/
function pluginList<const T extends Plugin<any[], any, any>[]>(plugins: {
  [K in keyof T]: [T[K], ...Parameters<NoInfer<T>[K]>]
}): PluggableList {
  return plugins
}

function rehypePlugin(this: Processor) {
  return (tree: HastNodes, file: VFile) => {
    visit(tree, (node, index, parent) => {
      // Add `codeBlock` to `pre` node
      if (
        node.type === 'element' &&
        node.tagName === 'code' &&
        parent &&
        parent.type === 'element' &&
        parent.tagName === 'pre'
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
