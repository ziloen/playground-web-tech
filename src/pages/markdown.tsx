import { Markdown } from '~/components/Markdown'

type MessageRole = 'user' | 'assistant'
type DisplayMode = 'top' | 'bottom'

type MessageNode = {
  id: string
  role: MessageRole
  content: string
  children: MessageNode[]
}

const PAGE_SIZE = 20
const NEAR_EDGE_PX = 420

const rootMessage = createMockTree()

export default function MarkdownPage() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const topBoundaryRef = useRef<HTMLDivElement>(null)
  const bottomBoundaryRef = useRef<HTMLDivElement>(null)
  const messageRefs = useRef(new Map<string, HTMLElement>())
  const commandRef = useRef<Promise<void>>(Promise.resolve())
  const edgeRevealPendingRef = useRef(false)
  const prependAnchorRef = useRef<{ height: number; top: number } | null>(null)
  const [mode, setMode] = useState<DisplayMode>('bottom')
  const [selectedChildByParentId, setSelectedChildByParentId] = useState<Record<string, string>>({})
  const [range, setRange] = useState(() => getInitialRange(resolvePath(rootMessage, {}), 'bottom'))
  const [jumpValue, setJumpValue] = useState('120')

  const path = useMemo(
    () => resolvePath(rootMessage, selectedChildByParentId),
    [selectedChildByParentId],
  )
  const renderedMessages = path.slice(range.start, range.end)
  const isComplete = range.start === 0 && range.end === path.length

  useLayoutEffect(() => {
    const anchor = prependAnchorRef.current
    const scrollEl = scrollRef.current
    if (!anchor || !scrollEl) return

    prependAnchorRef.current = null
    scrollEl.scrollTop = anchor.top + (scrollEl.scrollHeight - anchor.height)
  }, [range.start])

  useEffect(() => {
    setRange((prev) => clampRange(prev, path.length, mode))
  }, [mode, path.length])

  useEffect(() => {
    if (mode !== 'bottom') return
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [mode])

  const expandUp = useCallback(() => {
    if (range.start === 0) return
    const scrollEl = scrollRef.current
    if (scrollEl) {
      prependAnchorRef.current = {
        height: scrollEl.scrollHeight,
        top: scrollEl.scrollTop,
      }
    }
    setRange((prev) => ({ ...prev, start: Math.max(0, prev.start - PAGE_SIZE) }))
  }, [range.start])

  const expandDown = useCallback(() => {
    if (range.end === path.length) return
    setRange((prev) => ({ ...prev, end: Math.min(path.length, prev.end + PAGE_SIZE) }))
  }, [path.length, range.end])

  useEffect(() => {
    const scrollEl = scrollRef.current
    if (!scrollEl) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (edgeRevealPendingRef.current) return

        const intersectingEntry = entries.find((entry) => entry.isIntersecting)
        if (!intersectingEntry) return

        edgeRevealPendingRef.current = true
        if (intersectingEntry.target === topBoundaryRef.current) {
          expandUp()
        } else if (intersectingEntry.target === bottomBoundaryRef.current) {
          expandDown()
        }

        requestAnimationFrame(() => {
          edgeRevealPendingRef.current = false
        })
      },
      {
        root: scrollEl,
        rootMargin: `${NEAR_EDGE_PX}px 0px`,
        threshold: 0,
      },
    )

    const topBoundary = topBoundaryRef.current
    const bottomBoundary = bottomBoundaryRef.current
    if (topBoundary) observer.observe(topBoundary)
    if (bottomBoundary) observer.observe(bottomBoundary)

    return () => observer.disconnect()
  }, [expandDown, expandUp, range.end, range.start])

  const queueCommand = useCallback((command: () => Promise<void>) => {
    commandRef.current = commandRef.current.then(command, command)
  }, [])

  const scrollToEdge = useCallback(
    (edge: 'top' | 'bottom') => {
      queueCommand(async () => {
        if (edge === 'top') {
          await revealUntil(
            (current) => current.start === 0,
            () => {
              expandWindow('up')
            },
          )
          scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
          return
        }

        await revealUntil(
          (current) => current.end === path.length,
          () => {
            expandWindow('down', path.length)
          },
        )
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
      })
    },
    [path.length, queueCommand],
  )

  const scrollToMessage = useCallback(() => {
    const raw = jumpValue.trim()
    const targetIndex = Number(raw)
    const index =
      Number.isInteger(targetIndex) && targetIndex >= 1
        ? targetIndex - 1
        : path.findIndex((message) => message.id === raw)

    if (index < 0 || index >= path.length) return

    queueCommand(async () => {
      await revealUntil(
        (current) => current.start <= index && index < current.end,
        () => {
          setRange((current) => {
            if (index < current.start) {
              const scrollEl = scrollRef.current
              if (scrollEl) {
                prependAnchorRef.current = {
                  height: scrollEl.scrollHeight,
                  top: scrollEl.scrollTop,
                }
              }
              return { ...current, start: Math.max(0, current.start - PAGE_SIZE) }
            }

            return { ...current, end: Math.min(path.length, current.end + PAGE_SIZE) }
          })
        },
      )

      await nextFrame()
      messageRefs.current.get(path[index].id)?.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      })
    })
  }, [jumpValue, path, queueCommand])

  const selectBranch = useCallback((parent: MessageNode, child: MessageNode, pathIndex: number) => {
    setSelectedChildByParentId((current) => {
      const next = { ...current, [parent.id]: child.id }
      const nextPath = resolvePath(rootMessage, next)
      const nextEnd = Math.min(nextPath.length, pathIndex + 1 + PAGE_SIZE)
      setRange((prev) => ({
        start: Math.min(prev.start, pathIndex),
        end: Math.max(pathIndex + 1, nextEnd),
      }))
      return next
    })
  }, [])

  const resetMode = useCallback(
    (nextMode: DisplayMode) => {
      const nextPath = resolvePath(rootMessage, selectedChildByParentId)
      setMode(nextMode)
      setRange(getInitialRange(nextPath, nextMode))

      requestAnimationFrame(() => {
        const scrollEl = scrollRef.current
        if (!scrollEl) return
        scrollEl.scrollTo({ top: nextMode === 'top' ? 0 : scrollEl.scrollHeight })
      })
    },
    [selectedChildByParentId],
  )

  const resetConversation = useCallback(() => {
    const nextPath = resolvePath(rootMessage, {})
    edgeRevealPendingRef.current = true
    setSelectedChildByParentId({})
    setRange(getInitialRange(nextPath, mode))

    requestAnimationFrame(() => {
      const scrollEl = scrollRef.current
      if (scrollEl) {
        scrollEl.scrollTo({ top: mode === 'top' ? 0 : scrollEl.scrollHeight })
      }
      requestAnimationFrame(() => {
        edgeRevealPendingRef.current = false
      })
    })
  }, [mode])

  function expandWindow(direction: 'up' | 'down', pathLength = path.length) {
    setRange((current) => {
      if (direction === 'up') {
        const scrollEl = scrollRef.current
        if (scrollEl) {
          prependAnchorRef.current = {
            height: scrollEl.scrollHeight,
            top: scrollEl.scrollTop,
          }
        }
        return { ...current, start: Math.max(0, current.start - PAGE_SIZE) }
      }

      return { ...current, end: Math.min(pathLength, current.end + PAGE_SIZE) }
    })
  }

  async function revealUntil(
    done: (current: { start: number; end: number }) => boolean,
    reveal: () => void,
  ) {
    for (let guard = 0; guard < 20; guard += 1) {
      let complete = false
      setRange((current) => {
        complete = done(current)
        return current
      })
      await nextFrame()
      if (complete) return
      reveal()
      await nextFrame()
    }
  }

  return (
    <main className="grid h-full grid-rows-[auto_1fr] bg-[#f4f0e8] text-[#191712] scheme-light">
      <header className="z-10 border-b border-[#2f2a1f]/15 bg-[#f8f4ec]/95 px-5 py-4 shadow-[0_18px_50px_rgba(32,26,16,0.10)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
          <div className="me-auto">
            <h1 className="m-0 text-xl font-semibold tracking-normal">Markdown message tree</h1>
            <p className="m-0 mt-1 text-sm text-[#695f4d]">
              rendered {range.end - range.start} / {path.length} messages, window {range.start + 1}-
              {range.end}
              {isComplete ? ' complete' : ''}
            </p>
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

          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              scrollToMessage()
            }}
          >
            <input
              className="h-9 w-24 rounded-md border border-[#2f2a1f]/20 bg-white px-3 text-sm text-[#201a10] outline-none focus:border-[#b8482b]"
              aria-label="Message index or id"
              value={jumpValue}
              onChange={(event) => setJumpValue(event.target.value)}
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
          {range.start > 0 && (
            <div ref={topBoundaryRef} className="grid">
              <RenderBoundary count={range.start} label="above" onClick={expandUp} />
            </div>
          )}

          {renderedMessages.map((message, offset) => {
            const pathIndex = range.start + offset
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
                key={message.id}
                ref={(element) => {
                  if (element) {
                    messageRefs.current.set(message.id, element)
                  } else {
                    messageRefs.current.delete(message.id)
                  }
                }}
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
                          onClick={() => selectBranch(parent, sibling, pathIndex - 1)}
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
          })}

          {range.end < path.length && (
            <div ref={bottomBoundaryRef} className="grid">
              <RenderBoundary count={path.length - range.end} label="below" onClick={expandDown} />
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

function RenderBoundary({
  count,
  label,
  onClick,
}: {
  count: number
  label: 'above' | 'below'
  onClick: () => void
}) {
  return (
    <button
      className="mx-auto w-fit rounded-full border border-dashed border-[#7d7059]/40 bg-[#fffdf8] px-4 py-2 text-sm text-[#6b604e] shadow-sm hover:border-[#b8482b] hover:text-[#b8482b]"
      type="button"
      onClick={onClick}
    >
      Render {Math.min(PAGE_SIZE, count)} more {label} ({count} waiting)
    </button>
  )
}

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

function getInitialRange(path: MessageNode[], mode: DisplayMode) {
  if (mode === 'top') {
    return { start: 0, end: Math.min(path.length, PAGE_SIZE) }
  }

  return { start: Math.max(0, path.length - PAGE_SIZE), end: path.length }
}

function clampRange(range: { start: number; end: number }, length: number, mode: DisplayMode) {
  if (range.start >= length || range.end > length || range.start >= range.end) {
    return getInitialRange(Array.from({ length }) as MessageNode[], mode)
  }

  return {
    start: Math.max(0, range.start),
    end: Math.min(length, Math.max(range.start + 1, range.end)),
  }
}

function nextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
}

function modeButtonClass(active: boolean) {
  return clsx(
    'h-8 rounded-md border-none px-3 text-sm transition',
    active ? 'bg-[#201a10] text-white' : 'bg-transparent text-[#6b604e] hover:bg-[#f4ead7]',
  )
}

const toolbarButtonClass =
  'h-9 rounded-md border border-[#2f2a1f]/15 bg-white px-3 text-sm text-[#201a10] shadow-sm transition hover:border-[#b8482b] hover:text-[#b8482b]'

function createMockTree() {
  const main = Array.from({ length: 140 }, (_, index) => createMessage(index + 1, 'main'))

  for (let index = 0; index < main.length - 1; index += 1) {
    main[index].children.push(main[index + 1])
  }

  for (let index = 7; index < main.length - 12; index += 13) {
    main[index].children.push(createBranch(index + 2, 36, `u${index}`))
  }

  for (let index = 14; index < main.length - 18; index += 17) {
    main[index].children.push(createBranch(index + 2, 44, `a${index}`))
    main[index].children.push(createBranch(index + 2, 28, `alt${index}`))
  }

  return main[0]
}

function createBranch(start: number, count: number, name: string, depth = 0) {
  const branch = Array.from({ length: count }, (_, offset) =>
    createMessage(start + offset, name, offset),
  )

  for (let index = 0; index < branch.length - 1; index += 1) {
    branch[index].children.push(branch[index + 1])
  }

  for (let index = 9; depth < 2 && index < branch.length - 8; index += 15) {
    branch[index].children.push(
      createBranch(start + index + 1, 18, `${name}-fork${index}`, depth + 1),
    )
  }

  return branch[0]
}

function createMessage(index: number, branch: string, branchOffset = 0): MessageNode {
  const role: MessageRole = index % 2 === 0 ? 'assistant' : 'user'
  const id = branch === 'main' ? `m-${index}` : `${branch}-${branchOffset + 1}`

  return {
    id,
    role,
    content:
      role === 'user'
        ? createUserMessage(index, branch)
        : createAssistantMessage(index, branch, branchOffset),
    children: [],
  }
}

function createUserMessage(index: number, branch: string) {
  const samples = [
    '请比较这两种方案，保留边界条件和失败模式。',
    '这里的 **markdown**、`inline code` 和 [link](https://example.com) 应该按普通文本展示。',
    '把结果整理成可以直接执行的步骤，不要省略滚动行为。',
    '如果分支发生变化，上面的上下文需要保持稳定。',
    '继续补充复杂一点的数据，包含中文、English words 和 12345。',
  ]

  return `${samples[index % samples.length]}\n\nmessage=${index}, branch=${branch}`
}

function createAssistantMessage(index: number, branch: string, branchOffset: number) {
  const variant = (Math.floor(index / 2) + branchOffset + hashText(branch)) % 4
  const detailCount = 1 + ((index + branchOffset + branch.length) % 4)
  const details = Array.from({ length: detailCount }, (_, offset) => {
    return `- 观察点 ${offset + 1}: path=${branch}/${index + offset}, height-seed=${
      (index * 17 + offset * 31 + branch.length) % 997
    }`
  }).join('\n')

  const templates = [
    `## 渲染批次 ${index}

当前分支 \`${branch}\`，偏移 \`${branchOffset}\`。

- 只对 AI 消息渲染 markdown
- 用户消息保持原始文本
- 边缘滚动时追加窗口

${details}

> 这条消息用于观察 Markdown 排版和滚动高度变化。`,
    `### 代码路径 ${index}

\`\`\`tsx
type WindowRange = { start: number; end: number }

function revealWindow(range: WindowRange) {
  return messages
    .slice(range.start, range.end)
    .map((message, offset) => ({
      id: message.id,
      visualIndex: range.start + offset + 1,
    }))
}

console.table(revealWindow({ start: ${Math.max(0, index - 20)}, end: ${index} }))
\`\`\`

代码块会显著改变高度，适合验证补齐后滚动位置是否稳定。

${details}`,
    `### 数学与表格 ${index}

行内公式 \\(E = mc^2\\)，块级公式：

\\[
L_C = \\sum_{i=1}^{n} \\frac{x_i^2}{1 + i}
\\]

| 指标 | 当前值 | 说明 |
|:--|--:|:--|
| index | ${index} | 当前路径序号 |
| branch | ${branch.length} | 分支名长度 |
| offset | ${branchOffset} | 分支内偏移 |

${details}`,
    `<think>
这段 think 内容默认折叠，用于验证自定义 HTML 节点、展开动画和列表高度变化不会破坏消息窗口。
</think>

### 复杂 Markdown ${index}

1. 第一项包含 **加粗中文**
2. 第二项包含 \`inline token\`
3. 第三项包含长链接：[search](https://www.google.com/search?q=markdown%20lazy%20rendering%20tree%20branch)

滚动到指定消息时，如果目标还没有渲染，需要先 20 条一批补齐。

${details}`,
  ]

  return templates[variant]
}

function hashText(text: string) {
  let hash = 0
  for (const char of text) {
    hash = (hash * 31 + char.charCodeAt(0)) % 1_000_003
  }
  return hash
}
