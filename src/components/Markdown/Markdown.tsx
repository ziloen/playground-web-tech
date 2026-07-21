import '@fontsource-variable/fira-code/index.css'
import '@fontsource-variable/noto-sans-sc/index.css'
import 'katex/dist/katex.css'
import './Markdown.css'

import remarkMath from '@ziloen/remark-math'
import clsx from 'clsx/lite'
import { isNil } from 'es-toolkit'
import type { ElementContent, Element as HastElement, Nodes as HastNodes } from 'hast'
import type { Root as HastRoot } from 'hast'
import type { FootnoteDefinition, Link, Nodes as MdastNodes, Root, RootContent } from 'mdast'
import { toHast } from 'mdast-util-to-hast'
import { toMarkdown } from 'mdast-util-to-markdown'
import { toString } from 'mdast-util-to-string'
import { createContext, memo, use, useState } from 'react'
import type { Components as MarkdownComponents } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import remarkCjkFriendly from 'remark-cjk-friendly'
import remarkGfm from 'remark-gfm-configurable'
import type { Merge } from 'type-fest'
import type { PluggableList, Plugin, Processor } from 'unified'
import { visit } from 'unist-util-visit'
import type { VFile } from 'vfile'
import OcticonChevronDown12 from '~icons/octicon/chevron-down-12'
import { CodeBlock } from './CodeBlock'

// TODO: fix url space issue, e.g. [link](https://example.com/with space)

// TODO: custom footnote style [^1](https://example.com)
// TODO: 类似 ChatGPT 的 table 可以出血显示到屏幕宽度

const MarkdownContext = createContext<{
  streaming?: boolean | undefined | null
}>({})

export function Markdown({
  children,
  streaming,
  className,
  ...props
}: Merge<ComponentProps<'div'>, { children: string; streaming?: boolean }>) {
  // streaming 时，去掉未完成的 code block 开始或者结束标记，减少高度跳动
  if (streaming) {
    children = children.replace(/[ \n]``?$/, '')
  }

  const ctxValue = useMemo(() => ({ streaming }), [streaming])

  return (
    <div className={clsx('markdown-body', className)} {...props}>
      <MarkdownContext value={ctxValue}>
        <MemoReactMarkdown>{children}</MemoReactMarkdown>
      </MarkdownContext>
    </div>
  )
}

const MemoReactMarkdown = memo(function MemoReactMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      components={components as MarkdownComponents}
    >
      {children}
    </ReactMarkdown>
  )
})

type Components = {
  [Key in keyof React.JSX.IntrinsicElements]?:
    | React.ComponentType<React.JSX.IntrinsicElements[Key] & { node: HastElement }>
    | keyof React.JSX.IntrinsicElements
} & {
  think?: React.ComponentType<React.ComponentProps<'div'> & { node: HastElement }>
}

const components: Components = {
  code({ node, className, children, ...rest }) {
    const inline = node.properties.dataBlock !== 'true'
    const rawText = node.properties.dataText as string
    const language = node.properties.dataLanguage as string | null
    const complete = node.properties.dataComplete === 'true'

    const { streaming } = use(MarkdownContext)

    if (inline) {
      return <code className={className}>{children}</code>
    }

    if (!rawText.trim()) {
      return null
    }

    return (
      <CodeBlock code={rawText} language={language} streaming={streaming} className={className} />
    )
  },
  table({ children, node }) {
    return (
      <div className="scrollbar-thin overflow-x-auto overflow-y-clip">
        <table className="w-max tabular-nums">{children}</table>
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
          className="flex w-fit cursor-pointer items-center gap-1 select-none"
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
          <div className="mt-2 grid grid-flow-col justify-start">
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

const remarkPlugins = pluginList([
  // keep-multiline
  [
    remarkGfm,
    {
      plugins: {
        autolinkLiteral: false,
      },
    },
  ],
  [remarkMath, { displayMathInText: true }],
  [remarkCjkFriendly],
  [remarkPlugin],
])

const rehypePlugins = pluginList([
  [rehypeKatex, { errorColor: undefined, strict: 'ignore' }],
  [rehypePlugin],
  // FIXME: 设置只额外解析 <think> 标签而不是任意的标签
  [rehypeRaw],
])

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

function isFootnoteDefinition(node: RootContent): node is FootnoteDefinition {
  return node.type === 'footnoteDefinition'
}

type FootnoteMapValue = {
  identifier: string
  label?: string
  text: string
  markdown: string
  node: FootnoteDefinition
}

function serializeFootnoteDefinition(def: FootnoteDefinition): FootnoteMapValue {
  const root: Root = {
    type: 'root',
    children: def.children as RootContent[],
  }

  return {
    node: def,
    identifier: def.identifier,
    label: def.label ?? '',
    text: toString(root).trim(),
    markdown: toMarkdown(root).trim(),
  }
}

function remarkPlugin(this: Processor) {
  // https://github.com/micromark/micromark#case-turn-off-constructs
  // https://github.com/zestedesavoir/zmarkdown/issues/416#issuecomment-982812961
  // https://github.com/micromark/micromark/tree/main/packages/micromark-core-commonmark#api
  const data = this.data()
  const list = (data.micromarkExtensions ??= [])
  // disable `indentedCode` and `setext` syntax
  list.push({ disable: { null: ['codeIndented', 'setextUnderline'] } })

  return (tree: MdastNodes, file: VFile) => {
    let lastNode: MdastNodes = tree
    while ('children' in lastNode && lastNode.children && lastNode.children.length > 0) {
      lastNode = lastNode.children.at(-1)!
    }

    const footnotes = new Map<string, FootnoteMapValue>()

    if ('children' in tree) {
      for (const child of tree.children) {
        if (!isFootnoteDefinition(child)) continue

        footnotes.set(child.identifier, serializeFootnoteDefinition(child))
      }
    }

    visit(tree, (node, index, parent) => {
      // Remove footnotes
      if (parent && typeof index === 'number') {
        if (node.type === 'footnoteDefinition') {
          parent.children = parent.children.toSpliced(index, 1)
        }

        if (node.type === 'footnoteReference' && footnotes.has(node.identifier)) {
          const def = footnotes.get(node.identifier)!

          const link: Link = {
            type: 'link',
            children: [
              {
                type: 'text',
                value: node.label || node.identifier,
              },
            ],
            url: '#',
            title: null,
            data: {
              hProperties: {
                dataFootnoteMd: def.markdown,
                dataFootnoteText: def.text,
              },
            },
          }

          parent.children[index] = link
        }
      }

      // Add `iniline` / `text` / `language` to code node
      if (node.type === 'code' || node.type === 'inlineCode') {
        const isBlock = node.type === 'code'

        node.data ??= {}
        node.data.hProperties ??= {}
        node.data.hProperties.dataBlock = isBlock ? 'true' : 'false'

        if (isBlock) {
          node.data.hProperties.dataText = node.value
          node.data.hProperties.dataLanguage = node.lang

          const isLastNode = node === lastNode
          node.data.hProperties.dataComplete = isLastNode ? 'false' : 'true'
        }
      }
    })
  }
}
