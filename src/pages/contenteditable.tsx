import { LiteralUnion, patternMatching } from '@wai-ri/core'
import { useEventListener } from '~/hooks'
import { defineStore, reactivity, ref } from '~/stores'



export default reactivity(function ContentEditableText() {
  const inputRef = useRef<HTMLDivElement>(null!)
  const messageStore = useMessageStore()
  const messages = messageStore.messages

  useEventListener('beforeinput', onBeforeInput, { target: inputRef })

  useEventListener('input', (e: InputEvent) => {
    const inputType = e.inputType as InputType
    if (inputType === 'insertParagraph') {
      const text = transformContent(inputRef.current.children)
      if (!text) return
      messages.push({ text })
      inputRef.current.innerHTML = ""
    }
  }, { target: inputRef })

  useEffect(() => {
    document.execCommand('defaultParagraphSeparator', false, 'br')
  }, [])

  return (
    <div
      className='grid h-full w-full'
      style={{
        gridTemplateRows: 'minmax(0, 1fr) max-content',
        gridTemplateColumns: '1fr',
      }}
    >
      {/* add backdrop-filter blur */}

      <div className='overflow-y-auto'>
        <div className='border-b sticky top-0 backdrop-blur-md'>Chat room</div>
        {
          messages.map((m, i) => (
            <Message key={i} text={m.text} />
          ))
        }
      </div>

      {/* [ ] drag to resize the height */}
      {/* [x] paste and drop html to plaintext */}
      {/* [x] format input like Ctrl + B / Ctrl + I */}
      {/* [ ] max length */}
      {/* [ ] focus({ cursor: "start" | "end" | "all" | undefined }) */}
      {/* [ ] overflow issue when input */}
      <div
        ref={inputRef}
        contentEditable
        suppressContentEditableWarning
        autoFocus
        tabIndex={0}
        className='min-h-34px whitespace-pre-wrap word-wrap-break overflow-y-auto box-border leading-17px border-t text-14px outline-none max-w-full'>
      </div>
    </div>
  )
})



function Message({ text }: { text: string }) {
  return (
    <div className='rounded-4px bg-blue-4 w-max whitespace-pre-wrap word-wrap-break my-12px mx-12px p-10px'>
      {text}
    </div>
  )
}

type MessageType = {
  text: string
}

function transformContent(children: HTMLCollection) {
  const text = Array
    .from(children)
    .map(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent
      }
      if (node.nodeType === Node.ELEMENT_NODE && node.nodeName === 'BR') {
        return '\n'
      } else {
        return ''
      }
    })
    .join('')

  return text
}


/** remove style before input */
function onBeforeInput(e: InputEvent) {
  const { inputType, dataTransfer, data } = e

  // prevent format input
  if (inputType.startsWith('format')) return e.preventDefault()

  console.log('beforeinput', e)

  if (data || !dataTransfer) return

  if (inputType === 'insertFromPaste' || inputType === 'insertFromDrop') {
    const html = dataTransfer.getData('text/html')
    const text = dataTransfer.getData('text/plain')
    if (!text) return e.preventDefault()

    if (html) {
      e.preventDefault()

      // insertNode can not undo / redo，only execCommand can
      // const targetRange = e.getTargetRanges()[0]
      // const newRange = document.createRange()
      // newRange.setStart(targetRange.startContainer, targetRange.startOffset)
      // newRange.setEnd(targetRange.endContainer, targetRange.endOffset)
      // newRange.deleteContents()
      // newRange.insertNode(document.createTextNode(text))

      document.execCommand('insertText', false, text)
    }
  }
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


const useMessageStore = defineStore(() => {
  const messages = ref<MessageType[]>([])

  return {
    messages,
  }
})


function getSelectionStartPosition() {
  
}

function getSelectionEndPosition() {
  
}

function getCaretPosition() {
  
}