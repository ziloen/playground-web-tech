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

const rootMessage = createMockTree()

export default function MarkdownPage() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<DisplayMode>('bottom')
  const [selectedChildByParentId, setSelectedChildByParentId] = useState<Record<string, string>>({})
  const [jumpValue, setJumpValue] = useState('120')

  const path = useMemo(
    () => resolvePath(rootMessage, selectedChildByParentId),
    [selectedChildByParentId],
  )

  useLayoutEffect(() => {
    if (mode !== 'bottom') return
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [mode])

  const scrollToEdge = useMemoizedFn((edge: 'top' | 'bottom') => {
    const scrollEl = scrollRef.current
    if (!scrollEl) return

    scrollEl.scrollTo({
      top: edge === 'top' ? 0 : scrollEl.scrollHeight,
      behavior: 'smooth',
    })
  })

  const scrollToMessage = useMemoizedFn(() => {
    const rawValue = jumpValue.trim()
    const targetIndex = Number(rawValue)
    const index =
      Number.isInteger(targetIndex) && targetIndex >= 1
        ? targetIndex - 1
        : path.findIndex((message) => message.id === rawValue)

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
              onChange={(event) => setJumpValue(event.currentTarget.value)}
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
          {path.map((message, pathIndex) => {
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
          })}
        </div>
      </section>
    </main>
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
- 当前路径中的消息一次性完整渲染

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

代码块会显著改变高度，适合验证完整列表中的滚动定位是否稳定。

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
3. 第三项包含长链接：[search](https://www.google.com/search?q=markdown%20message%20tree%20branch)

滚动到指定消息时，目标消息应直接出现在完整渲染列表中。

${details}`,
  ]

  return templates[variant]
}

function hashText(text: string) {
  let hash = 0
  for (const char of text) {
    hash = (hash * 31 + char.codePointAt(0)!) % 1_000_003
  }
  return hash
}
