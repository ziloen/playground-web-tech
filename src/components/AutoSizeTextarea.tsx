// 参考：
// https://github.com/hsuanyi-chou/shadcn-ui-expansions/blob/main/components/ui/autosize-textarea.tsx

import { mergeRefs, useMemoizedFn } from '~/hooks'

type Props = React.ComponentProps<'textarea'>

export function AutoSizeTextarea({ ref, onChange, ...props }: Props) {
  // #region useState, useHookState
  const [triggerAutoSize, setTriggerAutoSize] = useState('')
  // #endregion

  // #region useRef
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // #endregion

  // #region useMemo
  // #endregion

  // #region functions, useImperativeHandle
  const resize = useMemoizedFn(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = '0'
    textarea.style.height = `${textarea.scrollHeight}px`
  })
  // #endregion

  // #region useHookEffect, useEffect
  useLayoutEffect(() => {
    resize()
  }, [triggerAutoSize])
  // #endregion

  return (
    <textarea
      ref={mergeRefs(textareaRef, ref)}
      onChange={(e) => {
        setTriggerAutoSize(e.currentTarget.value)
        onChange?.(e)
      }}
      {...props}
    >
    </textarea>
  )
}
