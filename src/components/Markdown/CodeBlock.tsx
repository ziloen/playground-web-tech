import { isNil } from 'es-toolkit'
import { useAutoResetState } from '~/hooks'
import { cn } from '~/utils'
import CarbonCheckmark from '~icons/carbon/checkmark'
import CarbonCopy from '~icons/carbon/copy'
import { CodeHighlighter, StreamingCodeHighlighter } from './CodeHighlighter'

export function CodeBlock({
  code,
  language,
  streaming,
  className,
}: {
  code: string
  language: string | null
  streaming: boolean | undefined | null
  className?: string
}) {
  const [copied, setCopied] = useAutoResetState(false, 2_000)

  return (
    <code className={cn('grid scheme-dark', className)}>
      {/* Header */}
      {/* Maybe click header to scroll to the top of code block */}
      <div className="gap-2 px-4 py-1 area-[1/1]">
        <span>{language}</span>
      </div>

      {/* 为使 sticky 生效，须要将 sticky 元素提升到 snap 容器的直接子元素 */}
      {/* sticky top 和 bottom 无法同时生效，top 优先级更高 */}
      {/* FIXME: 在 virtual list 中没有正确显示 */}
      <div className="@container-[scroll-state] sticky top-2 justify-self-end bg-inherit area-[1/1]">
        <button
          className="my-1 me-2 flex size-fit rounded-md border-none bg-transparent p-1 @stuck-top:shadow-md"
          title="Copy code"
          aria-label="Copy code"
          onClick={() => {
            navigator.clipboard.writeText(code).then(() => {
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

      <div className="scrollbar-thin overflow-x-auto overflow-y-clip px-4 pb-3">
        {isNil(streaming) ? (
          <CodeHighlighter code={code} language={language} />
        ) : (
          <StreamingCodeHighlighter code={code} language={language} />
        )}
      </div>
    </code>
  )
}
