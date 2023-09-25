import { LiteralUnion } from '@wai-ri/core'
import { useEventListener } from '~/hooks'


export default function ContentEditableText() {
  const ref = useRef<HTMLDivElement>(null!)

  useEventListener('beforeinput', e => {
    const inputType = e.inputType as InputType

    // 取消所有 fomat 相关的 input
    if (inputType.startsWith('format')) e.preventDefault()

    const { data, dataTransfer } = e
    const range = e.getTargetRanges()
    console.log(range)
    console.log('beforeinput', inputType, data, dataTransfer)
  }, { target: ref })

  useEventListener('input', (e: InputEvent) => {
    const type = e.inputType as InputType


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