import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Markdown } from '~/components/Markdown'
import { useMemoizedFn, useNextEffect } from '~/hooks'
import { useProgressiveList } from '~/hooks/useProgressiveList'
import { cn } from '~/utils'
import CarbonDownToBottom from '~icons/carbon/down-to-bottom'
import CarbonUpToTop from '~icons/carbon/up-to-top'

type MessageRole = 'user' | 'assistant'
type DisplayMode = 'top' | 'bottom'

type MessageNode = {
  id: string
  pathIndex: number
  branchIndex: number
  role: MessageRole
  content: string
  children: MessageNode[]
}

const STREAM_TOKEN_INTERVAL_MS = 50

export default function MarkdownPage() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<DisplayMode>('bottom')
  const [selectedChildByParentId, setSelectedChildByParentId] = useState<Record<string, string>>({})
  const [seed, setSeed] = useState(createSeed)
  const [rootMessage, setRootMessage] = useState(() => createMockTree(seed))

  const nextEffect = useNextEffect()
  const scrollRequestIdRef = useRef(0)
  const streamingTimersRef = useRef(new Map<string, number>())
  const [isStreaming, setIsStreaming] = useState(false)
  const sentMessageIndexRef = useRef(1)

  const refreshData = useMemoizedFn(async () => {
    stopAllStreaming()

    const nextSeed = createSeed()
    setSeed(nextSeed)
    setRootMessage(createMockTree(nextSeed))
    setSelectedChildByParentId({})
    sentMessageIndexRef.current = 1

    await nextEffect()
    scrollImmediately(mode)
  })

  const path = useMemo(
    () => resolvePath(rootMessage, selectedChildByParentId),
    [rootMessage, selectedChildByParentId],
  )

  // const progressivePath = useProgressiveList({
  //   items: path,
  //   getKey: (item) => item.id,
  //   direction: mode === 'bottom' ? 'tail' : 'head',
  //   resetKey: seed,
  //   debugLabel: import.meta.env.DEV ? 'markdown-path' : undefined,
  //   initialBatch: 20,
  // })

  const stopAllStreaming = useMemoizedFn(() => {
    for (const timerId of streamingTimersRef.current.values()) {
      window.clearInterval(timerId)
    }

    streamingTimersRef.current.clear()
    setIsStreaming(false)
  })

  useEffect(() => {
    return () => {
      stopAllStreaming()
    }
  }, [])

  // const progressiveDoneRef = useRef<Promise<void>>(progressivePath.donePromise)
  // progressiveDoneRef.current = progressivePath.donePromise

  useLayoutEffect(() => {
    if (mode !== 'bottom') return
    scrollImmediately('bottom')
  }, [mode])

  const scrollImmediately = useMemoizedFn(
    (to: 'top' | 'bottom' | number, behavior: ScrollBehavior = 'instant') => {
      const scrollEl = scrollRef.current
      if (!scrollEl) return

      if (to === 'top' || to === 'bottom') {
        scrollEl.scrollTo({
          top: to === 'top' ? 0 : Number.MAX_SAFE_INTEGER,
          behavior,
        })
      } else {
        const target = document.querySelector(`[data-message-index="${to}"]`)
        target?.scrollIntoView({
          block: 'center',
          behavior,
        })
      }
    },
  )

  const scrollAfterRendered = useMemoizedFn(
    async (to: 'top' | 'bottom' | number, behavior: ScrollBehavior = 'instant') => {
      const requestId = ++scrollRequestIdRef.current

      // await progressiveDoneRef.current

      if (requestId !== scrollRequestIdRef.current) return

      scrollImmediately(to, behavior)
    },
  )

  const selectBranch = useMemoizedFn((parent: MessageNode, child: MessageNode) => {
    setSelectedChildByParentId((current) => {
      return { ...current, [parent.id]: child.id }
    })
  })

  const startAssistantStream = useMemoizedFn((assistantId: string, sentIndex: number) => {
    const tokens = createAssistantStreamTokens(sentIndex)
    let nextTokenIndex = 0
    let content = ''

    window.clearInterval(streamingTimersRef.current.get(assistantId))
    setIsStreaming(true)

    const timerId = window.setInterval(() => {
      content += tokens[nextTokenIndex]
      nextTokenIndex++

      setRootMessage((current) => updateMessageContent(current, assistantId, content))

      if (nextTokenIndex >= tokens.length) {
        window.clearInterval(timerId)
        streamingTimersRef.current.delete(assistantId)
        setIsStreaming(false)
      }
    }, STREAM_TOKEN_INTERVAL_MS)

    streamingTimersRef.current.set(assistantId, timerId)
  })

  const sendMessage = useMemoizedFn(async () => {
    const parent = path.at(-1)
    if (!parent) return

    const sentIndex = sentMessageIndexRef.current++
    const parentBranchPath = getBranchPath(parent)
    const userBranchIndex = parent.children.length
    const userBranchPath = [...parentBranchPath, userBranchIndex]
    const assistantBranchPath = [...userBranchPath, 0]
    const userMessage = createRuntimeMessage(
      seed,
      'user',
      userBranchPath,
      `发送消息 ${sentIndex}\n\n这是一条立即加入对话的 user 消息。`,
    )
    const assistantMessage = createRuntimeMessage(seed, 'assistant', assistantBranchPath, '')

    userMessage.children.push(assistantMessage)

    setRootMessage((current) => appendChildToMessage(current, parent.id, userMessage))
    setSelectedChildByParentId((current) => ({
      ...current,
      [parent.id]: userMessage.id,
      [userMessage.id]: assistantMessage.id,
    }))
    startAssistantStream(assistantMessage.id, sentIndex)

    await nextEffect()
    if (mode === 'bottom') {
      scrollImmediately('bottom')
    }
  })

  const resetMode = useMemoizedFn(async (nextMode: DisplayMode) => {
    setMode(nextMode)

    await nextEffect()
    scrollImmediately(nextMode)
  })

  const resetConversation = useMemoizedFn(async () => {
    setSelectedChildByParentId({})

    await nextEffect()
    scrollImmediately(mode)
  })

  return (
    <main className="grid h-full grid-rows-[auto_1fr] bg-[#f4f0e8] text-[#191712] scheme-light">
      <header className="z-10 border-b border-[#2f2a1f]/15 bg-[#f8f4ec]/95 px-5 py-4 shadow-[0_18px_50px_rgba(32,26,16,0.10)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
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

          <button
            className={cn(toolbarButtonClass, 'flex-center')}
            type="button"
            onClick={() => scrollAfterRendered('top', 'smooth')}
            title="Scroll to top"
          >
            <CarbonUpToTop width={16} height={16} />
          </button>

          <form
            className=""
            onSubmit={(event) => {
              event.preventDefault()

              const formData = new FormData(event.currentTarget)
              scrollAfterRendered(Number(formData.get('jumpTo')), 'smooth')
            }}
          >
            <input
              type="number"
              name="jumpTo"
              className="h-8 w-12 rounded-md border border-[#2f2a1f]/20 bg-white px-2 text-sm text-[#201a10] outline-none [-moz-appearance:textfield] focus:border-[#b8482b] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Message index"
              defaultValue={9}
            />
          </form>

          <button
            className={cn(toolbarButtonClass, 'flex-center')}
            type="button"
            onClick={() => scrollAfterRendered('bottom', 'smooth')}
            title="Scroll to bottom"
          >
            <CarbonDownToBottom width={16} height={16} />
          </button>

          <button className={toolbarButtonClass} type="button" onClick={resetConversation}>
            Reset
          </button>
          <button
            className={toolbarButtonClass}
            type="button"
            onClick={isStreaming ? stopAllStreaming : sendMessage}
          >
            {isStreaming ? 'Stop' : 'Send Message'}
          </button>
          <button className={toolbarButtonClass} type="button" onClick={refreshData}>
            Refresh Data
          </button>
        </div>
      </header>

      <section
        ref={scrollRef}
        className="scrollbar-thin overflow-y-auto px-4 py-6"
        aria-label="Message list"
      >
        <div className="mx-auto grid max-w-4xl gap-4">
          {path.map((message, i) => (
            <MessageArticle
              key={message.id}
              message={message}
              parent={i > 0 ? path[i - 1] : undefined}
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
  selectBranch,
  parent,
}: {
  message: MessageNode
  parent?: MessageNode
  selectBranch: (parent: MessageNode, child: MessageNode) => void
}) {
  const siblings = parent?.children ?? []

  console.log('render message', message.id)

  return (
    <article
      className={clsx(
        'grid gap-2 rounded-lg border p-4 shadow-[0_10px_28px_rgba(34,28,17,0.07)]',
        message.role === 'user'
          ? 'ms-auto w-[min(760px,88%)] border-[#c8a447]/30 bg-[#fff9e7]'
          : 'me-auto w-[min(820px,94%)] border-[#44705b]/20 bg-white',
      )}
      data-message-id={message.id}
      data-message-index={message.pathIndex + 1}
      data-role={message.role}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-[#6e624e]">
        <strong className="text-[#201a10]">
          {message.role === 'user' ? 'User' : 'AI'} #{message.pathIndex + 1}
        </strong>
        <span className="break-all">{message.id}</span>
        <span>path={message.pathIndex}</span>
        <span>branch={message.branchIndex}</span>
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
                onClick={() => selectBranch(parent, sibling)}
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
    'h-6 rounded-md border-none px-2 text-sm transition',
    active ? 'bg-[#201a10] text-white' : 'bg-transparent text-[#6b604e] hover:bg-[#f4ead7]',
  )
}

const toolbarButtonClass =
  'h-8 rounded-md border border-[#2f2a1f]/15 bg-white px-2 text-sm text-[#201a10] shadow-sm transition hover:border-[#b8482b] hover:text-[#b8482b]'

function createSeed(): string {
  return Math.floor(Math.random() * 36 ** 4)
    .toString(36)
    .padStart(4, '0')
}

function createRng(seed: string) {
  const seedNumber = Number.parseInt(seed, 36)
  let s = seedNumber | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function createMessageId(seed: string, branchPath: number[]) {
  return `${seed}-${encodeBranchPath(branchPath)}`
}

function createRuntimeMessage(
  seed: string,
  role: MessageRole,
  branchPath: number[],
  content: string,
): MessageNode {
  return {
    id: createMessageId(seed, branchPath),
    pathIndex: branchPath.length - 1,
    branchIndex: branchPath.at(-1) ?? 0,
    role,
    content,
    children: [],
  }
}

function appendChildToMessage(
  root: MessageNode,
  parentId: string,
  child: MessageNode,
): MessageNode {
  if (root.id === parentId) {
    return { ...root, children: [...root.children, child] }
  }

  let changed = false
  const nextChildren: MessageNode[] = []

  for (const current of root.children) {
    const next = appendChildToMessage(current, parentId, child)
    if (next !== current) changed = true
    nextChildren.push(next)
  }

  if (!changed) return root

  return { ...root, children: nextChildren }
}

function updateMessageContent(root: MessageNode, messageId: string, content: string): MessageNode {
  if (root.id === messageId) {
    return { ...root, content }
  }

  let changed = false
  const nextChildren: MessageNode[] = []

  for (const current of root.children) {
    const next = updateMessageContent(current, messageId, content)
    if (next !== current) changed = true
    nextChildren.push(next)
  }

  if (!changed) return root

  return { ...root, children: nextChildren }
}

function createAssistantStreamTokens(sentIndex: number) {
  const sections = Array.from({ length: 5 }, (_, index) => {
    const step = index + 1

    return [
      `### 段落 ${step}\n\n`,
      `这是第 ${sentIndex} 次发送消息后的流式回复片段。`,
      '它会持续追加较长内容，用来观察 Markdown 渲染、高度变化、滚动位置和 progressive list 的协作行为。',
      '当前段落包含中文、English words、数字 12345，以及一些行内 `code`，确保不同文本形态都会参与更新。',
      '\n\n',
      '- 第一项会检查消息树末尾追加后的路径选择。\n',
      '- 第二项会检查 assistant 内容不断增长时 DOM 是否稳定。\n',
      '- 第三项会检查用户主动滚动按钮仍然等待完整 progressive render。\n\n',
      `> streaming block ${step}: 输出速度已经调快，长回复会更明显地推动内容区域增长。\n\n`,
    ].join(' ')
  })

  const content = [
    `## 流式回复 ${sentIndex}\n\n`,
    '这是一条较长的 assistant 消息，会以更快速度持续输出。',
    '它不是一次性替换整段文本，而是按 token 逐步追加，从而模拟真实的 streaming response。',
    '\n\n',
    ...sections,
    '## 总结\n\n',
    '流式输出完成后，这条消息会保留完整 Markdown 内容，并继续作为普通 assistant 消息参与分支和滚动测试。',
  ].join(' ')

  return content.match(/\S+\s*/g) ?? []
}

function createMockTree(seed: string): MessageNode {
  const rng = createRng(seed)
  let nextContentIndex = 0

  const createId = (branchPath: number[]): string => createMessageId(seed, branchPath)

  const getRole = (branchPath: number[]): MessageRole =>
    (branchPath.length - 1) % 2 === 0 ? 'assistant' : 'user'

  const makeNode = (branchPath: number[]): MessageNode => {
    const role = getRole(branchPath)

    return {
      id: createId(branchPath),
      pathIndex: branchPath.length - 1,
      branchIndex: branchPath.at(-1) ?? 0,
      role,
      content: pickContent(role, nextContentIndex++),
      children: [],
    }
  }

  const pickContent = (role: MessageRole, i: number): string => {
    const userSamples = [
      '请比较这两种方案，保留边界条件和失败模式。',
      '这里的 **markdown**、`inline code` 和 [link](https://example.com) 应该按普通文本展示。',
      '把结果整理成可以直接执行的步骤，不要省略滚动行为。',
      '如果分支发生变化，上面的上下文需要保持稳定。',
      '继续补充复杂一点的数据，包含中文、English words 和 12345。',
    ]

    const aiSamples = [
      `## 渲染批次 ${i}\n\n- 只对 AI 消息渲染 markdown\n- 用户消息保持原始文本\n\n> 观察 Markdown 排版和滚动高度变化。`,
      `### 代码路径 ${i}\n\n\`\`\`tsx\nconst seed = '${seed}'\nconst index = ${i}\nconsole.log({ seed, index })\n\`\`\`\n\n代码块会显著改变高度。`,
      `### 数学与表格 ${i}\n\n行内公式 \\(E = mc^2\\)\n\n| 指标 | 值 |\n|:--|--:|\n| seed | ${seed} |\n| index | ${i} |`,
    ]

    if (role === 'user') {
      return `${userSamples[i % userSamples.length]}\n\nmessage=${i}`
    }

    return aiSamples[i % aiSamples.length]
  }

  const buildChain = (length: number, depth: number, rootBranchPath: number[]): MessageNode => {
    const nodes = Array.from({ length }, (_, i) => {
      const branchPath = [...rootBranchPath, ...Array.from({ length: i }, () => 0)]
      return makeNode(branchPath)
    })

    for (let i = 0; i < nodes.length - 1; i++) {
      nodes[i].children.push(nodes[i + 1])
    }

    // Occasionally fork
    if (depth < 3 && length > 8 && rng() < 0.35) {
      const forkAt = 3 + Math.floor(rng() * (length - 8))
      const forkLen = 5 + Math.floor(rng() * 14)
      const branchIndex = nodes[forkAt].children.length
      const branchPath = [...getBranchPath(nodes[forkAt]), branchIndex]
      nodes[forkAt].children.push(buildChain(forkLen, depth + 1, branchPath))
    }

    return nodes[0]
  }

  const trunkLen = 100 + Math.floor(rng() * 80)
  const trunk = Array.from({ length: trunkLen }, (_, i) => {
    const branchPath = Array.from({ length: i + 1 }, () => 0)
    return makeNode(branchPath)
  })

  for (let i = 0; i < trunk.length - 1; i++) {
    trunk[i].children.push(trunk[i + 1])
  }

  const branchCount = 5 + Math.floor(rng() * 10)
  for (let b = 0; b < branchCount; b++) {
    const attachAt = 4 + Math.floor(rng() * (trunkLen - 20))
    const len = 8 + Math.floor(rng() * 35)
    const branchIndex = trunk[attachAt].children.length
    const branchPath = [...getBranchPath(trunk[attachAt]), branchIndex]
    trunk[attachAt].children.push(buildChain(len, 1, branchPath))

    // ~30% chance to attach a second parallel branch at the same node
    if (rng() < 0.3) {
      const len2 = 6 + Math.floor(rng() * 25)
      const branchIndex2 = trunk[attachAt].children.length
      const branchPath2 = [...getBranchPath(trunk[attachAt]), branchIndex2]
      trunk[attachAt].children.push(buildChain(len2, 1, branchPath2))
    }
  }

  return trunk[0]
}

function getBranchPath(message: MessageNode): number[] {
  const branchPath = message.id.slice(message.id.indexOf('-') + 1)
  return decodeBranchPath(branchPath)
}

function encodeBranchPath(branchPath: number[]): string {
  const parts: string[] = []

  for (let i = 0; i < branchPath.length; i++) {
    const branchIndex = branchPath[i]

    if (branchIndex !== 0) {
      parts.push(String(branchIndex))
      continue
    }

    let zeroCount = 1
    while (branchPath[i + zeroCount] === 0) {
      zeroCount++
    }

    parts.push(`z${zeroCount}`)
    i += zeroCount - 1
  }

  return parts.join('.')
}

function decodeBranchPath(encodedBranchPath: string): number[] {
  return encodedBranchPath.split('.').flatMap((part) => {
    if (part.startsWith('z')) {
      return Array.from({ length: Number(part.slice(1)) }, () => 0)
    }

    return Number(part)
  })
}
