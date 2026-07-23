import type { ScrollToOptions } from '@tanstack/react-virtual'
import { useVirtualizer } from '@tanstack/react-virtual'
import { button, buttonGroup, Leva, useControls } from 'leva'
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { LiteralUnion } from 'type-fest'
import { Markdown } from '~/components/Markdown'
import { useGetState, useMemoizedFn, useNextEffect } from '~/hooks'
import { propsEqualWith } from '~/utils'
import testMd from './markdown.test.md?raw'

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

const ESTIMATE_SIZE = 250
const VIRTUAL_OVERSCAN = 1

export default function MarkdownPage() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const streamingTimersRef = useRef(new Map<string, number>())
  const sentMessageIndexRef = useRef(1)
  const seenMessageIndexSet = useRef(new Set<number>())

  const [selectedChildByParentId, setSelectedChildByParentId] = useState<Record<string, string>>({})
  const [seed, setSeed] = useState(createSeed)
  const [rootMessage, setRootMessage] = useState(() => createMockTree(seed))
  const [isStreaming, setIsStreaming, getIsStreaming] = useGetState(false)
  const [scrollMargin, setScrollMargin] = useState(0)
  const [scrollElementHeight, setScrollElementHeight] = useState(0)
  const [streamingUserMessageId, setStreamingUserMessageId] = useState<string | null>(null)

  const nextEffect = useNextEffect()

  const [{ displayMode, assistantContent, immediateMode, renderedMessages }, setDebug] =
    useControls(() => ({
      renderedMessages: { value: '', disabled: true, label: 'visible range' },
      displayMode: { value: 'bottom' as DisplayMode, options: ['top', 'bottom'] as const },
      navigation: buttonGroup({
        label: null,
        opts: {
          scrollToTop: () => scrollTo('top', { behavior: 'smooth' }),
          scrollToBottom: () => scrollTo('bottom', { behavior: 'smooth' }),
        },
      }),
      jumpToIndex: { value: 0, min: 0, step: 1 },
      jump: button((get) => {
        const idx = get('jumpToIndex') as number
        scrollTo(idx, { behavior: 'smooth' })
      }),
      resetConversation: button(() => resetConversation()),
      assistantContent: '',
      sendOrStop: button(() => {
        if (getIsStreaming()) {
          stopAllStreaming()
        } else {
          sendMessage()
        }
      }),
      refreshData: button(() => refreshData()),
      immediateMode: { value: false, label: 'immediate (no stream)' },
    }))

  const path = useMemo(
    () => resolvePath(rootMessage, selectedChildByParentId),
    [rootMessage, selectedChildByParentId],
  )

  const getItemKey = useMemoizedFn((index: number) => path[index]?.id ?? index)

  // FIXME: 在使用鼠标中键进行向上滚动时，消息会出现跳动
  const virtualizer = useVirtualizer<HTMLElement, Element>({
    count: path.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ESTIMATE_SIZE,
    getItemKey,
    scrollEndThreshold: 20,
    scrollMargin: scrollMargin,
    scrollPaddingStart: 16,
    useScrollendEvent: true,
    overscan: VIRTUAL_OVERSCAN,
    gap: 8,
    // 首次挂载时直接定位到估算的列表底部，避免先渲染 index 0 附近的项，然后再跳转到底部。
    initialOffset: ESTIMATE_SIZE * path.length,
    // rangeExtractor: useMemoizedFn((range) => {
    //   const current = defaultRangeExtractor(range)

    //   const next = new Set([...seenMessageIndexSet.current, ...current])

    //   return [...next].sort((a, b) => a - b)
    // }),
    // onChange: useMemoizedFn((instance, sync) => {
    //   for (const idx of instance.getVirtualIndexes()) {
    //     seenMessageIndexSet.current.add(idx)
    //   }
    // }),
  })

  const virtualItems = virtualizer.getVirtualItems()
  const virtualIndexes = virtualizer.getVirtualIndexes()

  const stopAllStreaming = useMemoizedFn(() => {
    for (const rafId of streamingTimersRef.current.values()) {
      cancelAnimationFrame(rafId)
    }

    streamingTimersRef.current.clear()
    setIsStreaming(false)
  })

  const scrollTo = useMemoizedFn(
    (to: LiteralUnion<'top' | 'bottom', string> | number, options?: ScrollToOptions) => {
      const { behavior = 'instant' } = options ?? {}

      if (to === 'top') {
        virtualizer.scrollToOffset(0, { behavior })
      } else if (to === 'bottom') {
        virtualizer.scrollToEnd({ behavior })
      } else if (typeof to === 'number') {
        virtualizer.scrollToIndex(to, { align: options?.align ?? 'center', behavior })
      } else if (typeof to === 'string') {
        const index = path.findIndex((item) => item.id === to)
        virtualizer.scrollToIndex(index, { align: options?.align ?? 'center', behavior })
      }
    },
  )

  const selectBranch = useMemoizedFn((parent: MessageNode, child: MessageNode) => {
    seenMessageIndexSet.current.clear()
    setSelectedChildByParentId((current) => {
      return { ...current, [parent.id]: child.id }
    })
  })

  const startAssistantStream = useMemoizedFn((assistantId: string) => {
    const tokens = testMd
    const initialCount = (tokens.length / 2) | 0
    let nextTokenIndex = initialCount
    let content = tokens.slice(0, initialCount)

    cancelAnimationFrame(streamingTimersRef.current.get(assistantId) ?? 0)
    setIsStreaming(true)
    setStreamingUserMessageId(assistantId)

    const step = () => {
      content += tokens[nextTokenIndex]
      nextTokenIndex++

      setRootMessage((current) => updateMessageContent(current, assistantId, content))

      if (nextTokenIndex >= tokens.length) {
        streamingTimersRef.current.delete(assistantId)
        setIsStreaming(false)
        setStreamingUserMessageId(null)
      } else {
        streamingTimersRef.current.set(assistantId, requestAnimationFrame(step))
      }
    }

    streamingTimersRef.current.set(assistantId, requestAnimationFrame(step))
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
      createDefaultRuntimeUserContent(sentIndex),
    )
    const customAssistantContent = assistantContent.trim() ? assistantContent : ''
    const assistantMessage = createRuntimeMessage(
      seed,
      'assistant',
      assistantBranchPath,
      customAssistantContent,
    )

    userMessage.children.push(assistantMessage)

    setRootMessage((current) => appendChildToMessage(current, parent.id, userMessage))
    setSelectedChildByParentId((current) => ({
      ...current,
      [parent.id]: userMessage.id,
      [userMessage.id]: assistantMessage.id,
    }))
    setDebug({ assistantContent: '' })

    if (!customAssistantContent) {
      if (immediateMode) {
        setStreamingUserMessageId(null)
        setRootMessage((current) => updateMessageContent(current, assistantMessage.id, testMd))
      } else {
        startAssistantStream(assistantMessage.id)
      }
    }

    nextEffect(() => {
      scrollTo(userMessage.id, { behavior: 'smooth', align: 'start' })
    })
  })

  const resetConversation = useMemoizedFn(async () => {
    setSelectedChildByParentId({})

    await nextEffect()
    scrollTo(displayMode)
  })

  const refreshData = useMemoizedFn(async () => {
    stopAllStreaming()

    const nextSeed = createSeed()
    setSeed(nextSeed)
    setRootMessage(createMockTree(nextSeed))
    setSelectedChildByParentId({})
    seenMessageIndexSet.current.clear()
    sentMessageIndexRef.current = 1

    await nextEffect()
    scrollTo(displayMode)
  })

  useEffect(() => {
    if (virtualIndexes.length === 0) {
      setDebug({ renderedMessages: '0 / 0' })
      return
    }

    const start = virtualIndexes[0] + 1
    const end = virtualIndexes.at(-1)! + 1
    setDebug({
      renderedMessages: `${start} – ${end} ( ${virtualIndexes.length} / ${path.length} )`,
    })
  }, [virtualIndexes])

  useEffect(() => {
    return () => {
      stopAllStreaming()
    }
  }, [])

  useLayoutEffect(() => {
    if (displayMode === 'bottom') {
      virtualizer.scrollToEnd()
    } else {
      virtualizer.scrollToOffset(0)
    }
  }, [displayMode])

  virtualizer.shouldAdjustScrollPositionOnItemSizeChange = useMemoizedFn(
    (item, delta, instance) => {
      if (item.index >= path.length - 2) {
        return false
      } else {
        // tanstack virtual default behavior
        return (
          // @ts-expect-error private property
          // eslint-disable-next-line @typescript-eslint/restrict-plus-operands, @typescript-eslint/no-unsafe-call
          item.start < instance.getScrollOffset() + instance.scrollAdjustments &&
          (!instance.itemSizeCache.has(item.key) || instance.scrollDirection !== 'backward')
        )
      }
    },
  )

  useLayoutEffect(() => {
    const scrollEl = scrollRef.current
    const listEl = listRef.current
    if (!scrollEl || !listEl) return

    const updatePadding: ResizeObserverCallback = ([entry]) => {
      // FIXME: How to observe offsetTop?
      setScrollMargin(listEl.offsetTop)
      setScrollElementHeight(entry.borderBoxSize[0].blockSize)
    }

    const ro = new ResizeObserver(updatePadding)
    ro.observe(scrollEl, { box: 'border-box' })

    return () => ro.disconnect()
  }, [])

  const listHeight = virtualizer.getTotalSize()

  const computedListHeight = useMemo(() => {
    if (!streamingUserMessageId) return listHeight

    const virtualItem = virtualizer.getVirtualItems().find((v) => v.key === streamingUserMessageId)

    if (!virtualItem) return listHeight

    return Math.max(virtualItem.start + scrollElementHeight - 24, listHeight)
  }, [streamingUserMessageId, scrollElementHeight, listHeight])

  return (
    <main className="grid h-full bg-[#f4f0e8] text-[#191712] scheme-light">
      <Leva
        flat
        titleBar={{ title: 'Markdown Debug' }}
        theme={{
          colors: {
            elevation1: '#14181c',
            elevation2: '#1c2126',
            elevation3: '#252a30',
            accent1: '#7a9ec4',
            accent2: '#475769',
            accent3: '#a3bedb',
            highlight1: '#eef2f7',
            highlight2: '#b8c4d0',
            highlight3: '#fff',
            vivid1: '#d4a830',
          },
        }}
      />

      <section
        ref={scrollRef}
        className="scrollbar-thin overflow-y-auto pb-6"
        aria-label="Message list"
        style={{
          backgroundImage: 'repeating-conic-gradient(#5d5d5d 0% 25%, #333333 25% 50%)',
          backgroundSize: '30px 30px',
          backgroundAttachment: 'local',
        }}
      >
        {/* Header */}
        <div className={clsx('@container sticky top-0 isolate z-1 flex')}>
          <div
            className="@container -z-1 flex-1"
            style={{
              '--inherits-length-1': '100cqi',
              '--available-space': 'var(--inherits-length-1)',
            }}
          >
            <div
              className="@container mx-auto h-full"
              style={{ '--computed-with': 'calc(200cqi - var(--available-space))' }}
            >
              <div
                className="h-full @style-[--computed-with_<=_800px]:bg-black/30 @style-[--computed-with_<=_800px]:backdrop-blur-[20px]"
                style={{
                  width: 'var(--available-space)',
                }}
              />
            </div>
          </div>

          <div className="ms-auto h-20 w-30 bg-red"></div>
        </div>

        <div className="mb-4 h-[calc(50vh+100px)] bg-green"></div>

        <div
          ref={listRef}
          className="relative mx-auto w-full max-w-[800px] overflow-clip"
          style={{ height: computedListHeight }}
        >
          {virtualItems.map((virtualItem) => {
            const message = path[virtualItem.index]!
            return (
              <div
                key={virtualItem.key}
                ref={virtualizer.measureElement}
                data-index={virtualItem.index}
                className="absolute top-0 left-0 w-full"
                style={{
                  transform: `translateY(${virtualItem.start - virtualizer.options.scrollMargin}px)`,
                }}
              >
                <MessageArticle
                  message={message}
                  parent={virtualItem.index > 0 ? path[virtualItem.index - 1] : undefined}
                  selectBranch={selectBranch}
                  streaming={streamingUserMessageId === message.id}
                />
              </div>
            )
          })}
        </div>

        {/* <div className="mt-4 h-[calc(40vh)] bg-green"></div> */}
      </section>

      <div className="pointer-events-none fixed inset-0 my-auto h-px w-full bg-current px-4 text-red text-shadow-lg">
        Center
      </div>
    </main>
  )
}

type MessageArticleProps = {
  message: MessageNode
  parent?: MessageNode
  streaming: boolean
  selectBranch: (parent: MessageNode, child: MessageNode) => void
}

const propsAreEqual = propsEqualWith<MessageArticleProps>({
  message: propsEqualWith({
    children: (a, b) => a.length === b.length && a.every((v, i) => v.id === b[i].id),
  }),
  parent: (a, b) => a?.id === b?.id,
})

const MessageArticle = memo<MessageArticleProps>(function MessageArticle({
  message,
  selectBranch,
  parent,
  streaming,
}) {
  const siblings = parent?.children ?? []

  console.log('msg', message.id)

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
        <Markdown className="text-[15px] leading-7" streaming={streaming}>
          {message.content}
        </Markdown>
      )}
    </article>
  )
}, propsAreEqual)

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

function createDefaultRuntimeUserContent(sentIndex: number) {
  return `发送消息 ${sentIndex}\n\n这是一条立即加入对话的 user 消息。`
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
    if (role === 'user') {
      const userSamples = [
        '请比较这两种方案，保留边界条件和失败模式。',
        '这里的 **markdown**、`inline code` 和 [link](https://example.com) 应该按普通文本展示。',
        '把结果整理成可以直接执行的步骤，不要省略滚动行为。',
        '如果分支发生变化，上面的上下文需要保持稳定。',
        '继续补充复杂一点的数据，包含中文、English words 和 12345。',
      ]

      return `${userSamples[i % userSamples.length]}\n\nmessage=${i}`
    }

    const aiSamples = [
      `## 渲染批次 ${i}\n\n- 只对 AI 消息渲染 markdown\n- 用户消息保持原始文本\n\n> 观察 Markdown 排版和滚动高度变化。`,
      `### 代码路径 ${i}\n\n\`\`\`tsx\nconst seed = '${seed}'\nconst index = ${i}\nconsole.log({ seed, index })\n\`\`\`\n\n代码块会显著改变高度。`,
      `### 数学与表格 ${i}\n\n行内公式 \\(E = mc^2\\)\n\n| 指标 | 值 |\n|:--|--:|\n| seed | ${seed} |\n| index | ${i} |`,
    ]

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
