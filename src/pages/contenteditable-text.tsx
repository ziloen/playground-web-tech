import { LiteralUnion } from '@wai-ri/core'
import { useEventListener } from '~/hooks'


export default function ContentEditableText() {
  const ref = useRef<HTMLDivElement>(null!)

  useEventListener('beforeinput', e => {
    const { inputType, dataTransfer, data } = e

    // 取消所有 fomat 相关的 input
    if (inputType.startsWith('format')) return e.preventDefault()

    console.log('beforeinput', e)

    if (data || !dataTransfer) return

    if (inputType === 'insertFromPaste' || inputType === 'insertFromDrop') {
      const html = dataTransfer.getData('text/html')
      const text = dataTransfer.getData('text/plain')
      if (!text) return e.preventDefault()

      if (html) {
        e.preventDefault()

        // insertNode 不能使用 undo redo，只有 execCommand 可以
        // const targetRange = e.getTargetRanges()[0]
        // const newRange = document.createRange()
        // newRange.setStart(targetRange.startContainer, targetRange.startOffset)
        // newRange.setEnd(targetRange.endContainer, targetRange.endOffset)
        // newRange.deleteContents()
        // newRange.insertNode(document.createTextNode(text))

        document.execCommand('insertText', false, text)
      }
    }
  }, { target: ref })

  useEventListener('input', (e: InputEvent) => {
    const inputType = e.inputType as InputType
    // console.log('onInput', inputType)
  }, { target: ref })

  return (
    <div className='grid h-full w-full grid-rows-[auto_1fr_auto]'>
      {/* add backdrop-filter blur */}
      <div className='border-b '>
        HAHSSHH
      </div>

      <div className=''>

      </div>

      {/* [ ] 1. drag to resize the height */}
      {/* [ ] 2. paste and drop html to plaintext */}
      {/* [x] 3. format input like Ctrl + B / Ctrl + I */}
      {/* [ ] 4. max length */}
      {/* [ ] 5. focus({ cursor: "start" | "end" | "all" | undefined }) */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        tabIndex={0}
        style={{ wordBreak: 'break-word' }}
        className='min-h-34px whitespace-pre-wrap h-max overflow-y-auto leading-17px border-t text-14px outline-none max-w-full'>
      </div>
    </div>
  )
}



// 具体参见 InputEvent.inputType 标准文档 https://rawgit.com/w3c/input-events/v1/index.html#interface-InputEvent-Attributes
type InputType = LiteralUnion<
  // 纯文本输入，输入内容在 data 属性中
  | 'insertText'
  // 中文等输入法合成阶段输入，输入内容在 data 属性中
  | 'insertCompositionText'
  // 从剪贴板粘贴，输入内容在 dataTransfer 属性中（Chrome 中没有？）
  | 'insertFromPaste'
  // backspace 键删除
  | 'suppressContentEditableWarning'
  // Ctrl + B 选中文字 变成/取消 粗体
  // formatXxxx 均为修改文本样式 input
  | 'formatBold'
>


function plaintextEvent(e: React.ClipboardEvent | React.DragEvent) {
  const nativeEvent = e.nativeEvent
  const dataInput = nativeEvent instanceof ClipboardEvent
    ? nativeEvent.clipboardData
    : nativeEvent.dataTransfer
  if (!dataInput) return
  const htmlOrigin = dataInput.getData('text/html')
  const textPlain = dataInput.getData('text/plain')

  if (htmlOrigin) {
    e.preventDefault()

    // FIXME: 从自己内选中内容拖放时，位置不对
    const lastRange = window.getSelection()?.getRangeAt(0)
    if (!lastRange) return
    const newNode = document.createTextNode(textPlain)
    lastRange.deleteContents()
    lastRange.insertNode(newNode)
    lastRange.setStartAfter(newNode)
  }
}