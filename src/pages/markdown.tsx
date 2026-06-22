import { memo, useState } from 'react'
import { Markdown } from '~/components/Markdown'
import { useMemoizedFn } from '~/hooks'

type MessageRole = 'user' | 'assistant'
type DisplayMode = 'top' | 'bottom'

type MessageNode = {
  id: string
  role: MessageRole
  content: string
  children: MessageNode[]
}

export default function MarkdownPage() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<DisplayMode>('bottom')
  const [selectedChildByParentId, setSelectedChildByParentId] = useState<Record<string, string>>({})
  const [seed, setSeed] = useState(() => Date.now())
  const rootMessage = useMemo(() => createMockTree(seed), [seed])

  const refreshData = useMemoizedFn(() => {
    setSeed(Date.now())
    setSelectedChildByParentId({})
  })

  const path = useMemo(
    () => resolvePath(rootMessage, selectedChildByParentId),
    [selectedChildByParentId],
  )

  useLayoutEffect(() => {
    if (mode !== 'bottom') return
    scrollRef.current?.scrollTo({ top: Number.MAX_SAFE_INTEGER, behavior: 'instant' })
  }, [mode])

  const scrollToEdge = useMemoizedFn((edge: 'top' | 'bottom') => {
    const scrollEl = scrollRef.current
    if (!scrollEl) return

    scrollEl.scrollTo({
      top: edge === 'top' ? 0 : Number.MAX_SAFE_INTEGER,
      behavior: 'smooth',
    })
  })

  const scrollToMessage = useMemoizedFn((jumpTo: number) => {
    const targetIndex = jumpTo
    const index =
      Number.isInteger(targetIndex) && targetIndex >= 1
        ? targetIndex - 1
        : path.findIndex((message) => message.id === String(jumpTo))

    if (index < 0 || index >= path.length) return

    document.querySelector(`[data-message-id="${CSS.escape(path[index].id)}"]`)?.scrollIntoView({
      block: 'center',
      behavior: 'smooth',
    })
  })

  const selectBranch = useMemoizedFn(
    (parent: MessageNode, child: MessageNode, pathIndex: number) => {
      setSelectedChildByParentId((current) => {
        return { ...current, [parent.id]: child.id }
      })
    },
  )

  const resetMode = useMemoizedFn((nextMode: DisplayMode) => {
    setMode(nextMode)

    requestAnimationFrame(() => {
      const scrollEl = scrollRef.current
      if (!scrollEl) return

      scrollEl.scrollTo({
        top: nextMode === 'top' ? 0 : scrollEl.scrollHeight,
      })
    })
  })

  const resetConversation = useMemoizedFn(() => {
    setSelectedChildByParentId({})

    requestAnimationFrame(() => {
      const scrollEl = scrollRef.current
      if (!scrollEl) return

      scrollEl.scrollTo({
        top: mode === 'top' ? 0 : scrollEl.scrollHeight,
      })
    })
  })

  return (
    <main className="grid h-full grid-rows-[auto_1fr] bg-[#f4f0e8] text-[#191712] scheme-light">
      <header className="z-10 border-b border-[#2f2a1f]/15 bg-[#f8f4ec]/95 px-5 py-4 shadow-[0_18px_50px_rgba(32,26,16,0.10)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
          <div className="me-auto">
            <h1 className="m-0 text-xl font-semibold tracking-normal">Markdown message tree</h1>
            <p className="m-0 mt-1 text-sm text-[#695f4d]">rendered {path.length} messages</p>
          </div>

          <div className="flex rounded-lg border border-[#2f2a1f]/15 bg-white p-1">
            <button
              className={modeButtonClass(mode === 'top')}
              type="button"
              onClick={() => resetMode('top')}
            >
              Top
            </button>
            <button
              className={modeButtonClass(mode === 'bottom')}
              type="button"
              onClick={() => resetMode('bottom')}
            >
              Bottom
            </button>
          </div>

          <button className={toolbarButtonClass} type="button" onClick={() => scrollToEdge('top')}>
            To top
          </button>
          <button
            className={toolbarButtonClass}
            type="button"
            onClick={() => scrollToEdge('bottom')}
          >
            To bottom
          </button>
          <button className={toolbarButtonClass} type="button" onClick={resetConversation}>
            Reset
          </button>
          <button className={toolbarButtonClass} type="button" onClick={refreshData}>
            Refresh Data
          </button>

          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault()

              const formData = new FormData(event.currentTarget)
              scrollToMessage(Number(formData.get('jumpTo')))
            }}
          >
            <input
              type="number"
              name="jumpTo"
              className="h-9 w-24 rounded-md border border-[#2f2a1f]/20 bg-white px-3 text-sm text-[#201a10] outline-none focus:border-[#b8482b]"
              aria-label="Message index or id"
              defaultValue={9}
            />
            <button className={toolbarButtonClass} type="submit">
              Go
            </button>
          </form>
        </div>
      </header>

      <section
        ref={scrollRef}
        className="scrollbar-thin overflow-y-auto px-4 py-6"
        aria-label="Message list"
      >
        <div className="mx-auto grid max-w-4xl gap-4">
          {path.map((message, pathIndex, path) => (
            <MessageArticle
              key={message.id}
              message={message}
              pathIndex={pathIndex}
              path={path}
              selectBranch={selectBranch}
            />
          ))}
        </div>
      </section>
    </main>
  )
}

const MessageArticle = memo(function MessageArticle({
  message,
  pathIndex,
  selectBranch,
  path,
}: {
  message: MessageNode
  pathIndex: number
  path: MessageNode[]
  selectBranch: (parent: MessageNode, child: MessageNode, pathIndex: number) => void
}) {
  const parent = path[pathIndex - 1]
  const siblings = parent?.children ?? []

  return (
    <article
      className={clsx(
        'grid gap-2 rounded-lg border p-4 shadow-[0_10px_28px_rgba(34,28,17,0.07)]',
        message.role === 'user'
          ? 'ms-auto w-[min(760px,88%)] border-[#c8a447]/30 bg-[#fff9e7]'
          : 'me-auto w-[min(820px,94%)] border-[#44705b]/20 bg-white',
      )}
      data-message-id={message.id}
      data-message-index={pathIndex + 1}
      data-role={message.role}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-[#6e624e]">
        <strong className="text-[#201a10]">
          {message.role === 'user' ? 'User' : 'AI'} #{pathIndex + 1}
        </strong>
        <span>{message.id}</span>
        {siblings.length > 1 && parent && (
          <div className="ms-auto flex items-center gap-1 rounded-full border border-[#2f2a1f]/10 bg-[#f8f4ec] p-1">
            {siblings.map((sibling, siblingIndex) => (
              <button
                className={clsx(
                  'h-7 min-w-7 rounded-full border-none px-2 text-xs transition',
                  sibling.id === message.id
                    ? 'bg-[#201a10] text-white'
                    : 'bg-transparent text-[#6b604e] hover:bg-white',
                )}
                type="button"
                key={sibling.id}
                title={`Switch to branch ${siblingIndex + 1}`}
                aria-label={`Switch to branch ${siblingIndex + 1}`}
                onClick={() => selectBranch(parent, sibling, pathIndex)}
              >
                {siblingIndex + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {message.role === 'user' ? (
        <p className="m-0 text-[15px] leading-7 whitespace-pre-wrap text-[#241f16]">
          {message.content}
        </p>
      ) : (
        <Markdown className="text-[15px] leading-7">{message.content}</Markdown>
      )}
    </article>
  )
})

function resolvePath(root: MessageNode, selectedChildByParentId: Record<string, string>) {
  const path: MessageNode[] = []
  let current: MessageNode | undefined = root

  while (current) {
    path.push(current)
    const selectedChildId: string | undefined = selectedChildByParentId[current.id]
    current =
      current.children.find((child) => child.id === selectedChildId) ?? current.children.at(0)
  }

  return path
}

function modeButtonClass(active: boolean) {
  return clsx(
    'h-8 rounded-md border-none px-3 text-sm transition',
    active ? 'bg-[#201a10] text-white' : 'bg-transparent text-[#6b604e] hover:bg-[#f4ead7]',
  )
}

const toolbarButtonClass =
  'h-9 rounded-md border border-[#2f2a1f]/15 bg-white px-3 text-sm text-[#201a10] shadow-sm transition hover:border-[#b8482b] hover:text-[#b8482b]'

function createRng(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function createMockTree(seed: number): MessageNode {
  const rng = createRng(seed)
  let nextId = 0

  // ---- helpers -----------------------------------------------------------
  const uid = (): string => `m-${nextId++}`

  const makeNode = (role: MessageRole, content: string): MessageNode => ({
    id: uid(),
    role,
    content,
    children: [],
  })

  const pickContent = (i: number): string => {
    const userSamples = [
      '请比较这两种方案，保留边界条件和失败模式。',
      '这里的 **markdown**、`inline code` 和 [link](https://example.com) 应该按普通文本展示。',
      '把结果整理成可以直接执行的步骤，不要省略滚动行为。',
      '如果分支发生变化，上面的上下文需要保持稳定。',
      '继续补充复杂一点的数据，包含中文、English words 和 12345。',
    ]

    const aiSamples = [
      `## 渲染批次 ${i}\n\n- 只对 AI 消息渲染 markdown\n- 用户消息保持原始文本\n\n> 观察 Markdown 排版和滚动高度变化。`,
      `### 代码路径 ${i}\n\n\`\`\`tsx\nconst seed = ${seed}\nconst index = ${i}\nconsole.log({ seed, index })\n\`\`\`\n\n代码块会显著改变高度。`,
      `### 数学与表格 ${i}\n\n行内公式 \\(E = mc^2\\)\n\n| 指标 | 值 |\n|:--|--:|\n| seed | ${seed} |\n| index | ${i} |`,
    ]

    if (i % 2 === 1) {
      return `${userSamples[i % userSamples.length]}\n\nmessage=${i}`
    }
    return aiSamples[i % aiSamples.length]
  }

  // ---- build a linear chain, optionally with sub-branches -----------------
  const buildChain = (length: number, depth: number): MessageNode => {
    const nodes = Array.from({ length }, (_, i) =>
      makeNode(i % 2 === 0 ? 'assistant' : 'user', pickContent(i + nextId)),
    )

    for (let i = 0; i < nodes.length - 1; i++) {
      nodes[i].children.push(nodes[i + 1])
    }

    // Occasionally fork
    if (depth < 3 && length > 8 && rng() < 0.35) {
      const forkAt = 3 + Math.floor(rng() * (length - 8))
      const forkLen = 5 + Math.floor(rng() * 14)
      nodes[forkAt].children.push(buildChain(forkLen, depth + 1))
    }

    return nodes[0]
  }

  // ---- main trunk ---------------------------------------------------------
  const trunkLen = 100 + Math.floor(rng() * 80)
  const trunk = Array.from({ length: trunkLen }, (_, i) =>
    makeNode(i % 2 === 0 ? 'assistant' : 'user', pickContent(i)),
  )

  for (let i = 0; i < trunk.length - 1; i++) {
    trunk[i].children.push(trunk[i + 1])
  }

  // ---- scatter branches onto the trunk ------------------------------------
  const branchCount = 5 + Math.floor(rng() * 10)
  for (let b = 0; b < branchCount; b++) {
    const attachAt = 4 + Math.floor(rng() * (trunkLen - 20))
    const len = 8 + Math.floor(rng() * 35)
    trunk[attachAt].children.push(buildChain(len, 1))

    // ~30% chance to attach a second parallel branch at the same node
    if (rng() < 0.3) {
      const len2 = 6 + Math.floor(rng() * 25)
      trunk[attachAt].children.push(buildChain(len2, 1))
    }
  }

  return trunk[0]
}
