/* eslint-disable unicorn/prefer-dom-node-text-content */
import styles from './contenteditable.module.css'

import { asType } from '@wai-ri/core'
import type { RefCallback } from 'react'
import type { InputEventInputType, KeyboardEventKey } from 'ts-lib-enhance'
import { createContext, useContextSelector } from 'use-context-selector'

const MAX_LENGTH = 100

const isChromium = (() => {
  // @ts-expect-error useAgentData is non-standard now
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const brands = navigator.userAgentData?.brands as Array<{ brand: string }>
  if (!brands) return false
  return brands.some(({ brand }) => brand === 'Chromium')
})()

export default function ContentEditableText() {
  // const inputRef = useRef<HTMLDivElement>(null!)
  const currentLength = useMotionValue(0)
  const messages = useMessages()

  const inputRef = useCallback<RefCallback<HTMLDivElement>>((el) => {
    if (!el) return

    const ac = new AbortController()

    el.addEventListener('beforeinput', onBeforeInput, { signal: ac.signal })

    el.addEventListener('input', (e) => {
      asType<InputEvent>(e)
      const inputType = e.inputType as InputEventInputType
      if (inputType === 'insertParagraph') {
        // const text = transformContent(el)
        // if (!text) return
        // messages.push({ text })
        // el.innerHTML = ''
        const mentions = getMentionsFromTarget(el)
        console.log(mentions)
      }

      const length = el.innerText.length ?? 0
      currentLength.set(length)
    }, { signal: ac.signal })

    el.addEventListener('keydown', (e) => {
      const key = e.key as KeyboardEventKey

      if (key === 'Enter') {
      }
    }, { signal: ac.signal })

    el.addEventListener('compositionstart', (e) => {
    }, { signal: ac.signal })

    return () => ac.abort()
  }, [])

  return (
    <div
      className="grid size-full"
      style={{
        gridTemplateRows: 'minmax(0, 1fr) max-content',
        gridTemplateColumns: '1fr',
      }}
    >
      {/* add backdrop-filter blur */}
      <div className="overflow-y-auto w-full relative">
        <div className="sticky flex-col flex w-full top-0 left-0 right-0 border-b border-b-white/20">
          <div className="backdrop-blur-[8px] bg-black/20 shrink-0 px-[10px] py-[8px]">
            Chat room
          </div>
          <div className="h-[2px] backdrop-blur-[90px] backdrop-saturate-[1.05] backdrop-brightness-[1.05]">
          </div>
        </div>

        {messages.map((m, i) => <Message key={i} text={m.text} />)}
      </div>

      {/* [ ] drag to resize the height */}
      {/* [x] paste and drop html to plaintext */}
      {/* [x] format input like Ctrl + B / Ctrl + I */}
      {/* [ ] max length */}
      {/* [ ] focus({ cursor: "start" | "end" | "all" | undefined }) */}
      {/* [ ] overflow issue when input */}
      {/* [ ] max length, crop text when pasting */}
      <div className="border-t border-t-white/20 grid">
        <div
          ref={inputRef}
          contentEditable
          suppressContentEditableWarning
          autoFocus
          data-placeholder="Type something..."
          tabIndex={0}
          className={clsx(
            'min-h-[54px] px-[8px] py-[10px] focus:outline-lightBlue-6 inline-block whitespace-pre-wrap word-wrap-break overflow-y-auto box-border leading-[17px] text-[14px] outline-none max-w-full',
            styles.contenteditable,
          )}
        >
        </div>

        <div className="flex justify-self-end mr-[10px] mb-[10px]">
          <motion.div>{currentLength}</motion.div>&nbsp;/&nbsp;{MAX_LENGTH}
        </div>
      </div>
    </div>
  )
}

const messageContext = createContext({
  messages: [] as MessageType[],
})

function useMessages() {
  return useContextSelector(messageContext, (s) => s.messages)
}

function Message({ text }: { text: string }) {
  return (
    <div className="rounded-[4px] bg-blue-4 max-w-fit whitespace-pre-wrap word-wrap-break my-[12px] mx-[12px] p-[10px]">
      {text}
    </div>
  )
}

type MessageType = {
  text: string
}

/** remove style before input */
function onBeforeInput(e: InputEvent) {
  const { dataTransfer, data } = e
  const inputType = e.inputType as InputEventInputType
  // prevent format input
  if (inputType.startsWith('format')) return e.preventDefault()

  const currentLength = (e.currentTarget as HTMLDivElement).innerText.length ?? 0

  if (currentLength >= MAX_LENGTH && !inputType.startsWith('delete')) {
    if (inputType === 'insertCompositionText') {
      // insertCompositionText can not be canceled
      truncToMaxLength(e.currentTarget as HTMLDivElement, MAX_LENGTH)
    } else {
      e.preventDefault()
    }

    return
  }

  if (inputType === 'insertParagraph') {
    e.preventDefault()
    // document.execCommand('insertText', false, '\n')
    const nl = document.createTextNode(' \n')
    insertNodeAtCaret(nl)
    return
  }

  if (inputType === 'insertText' && data === '@') {
    e.preventDefault()

    if (isChromium) {
      // do not use user-select: none in chrome, strange behavior
      document.execCommand('insertText', false, ' ')

      document.execCommand(
        'insertHTML',
        false,
        '<span contenteditable="false" data-mention-id="qqq" class=" underline-white bg-green/20 underline select-text">@qqq</span>',
      )
      skipNonEditable()

      document.execCommand('insertText', false, ' ')
    } else {
      const span = document.createElement('span')
      span.contentEditable = 'false'
      span.className = 'underline-white bg-green/20 underline select-text'
      span.innerText = '@qqq'
      span.dataset.mentionId = 'qqq'
      insertNodeAtCaret(span)
    }

    return
  }

  if (data || !dataTransfer) return

  if (inputType === 'insertFromPaste' || inputType === 'insertFromDrop') {
    const html = dataTransfer.getData('text/html')
    const text = dataTransfer.getData('text/plain')
    //
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

/**
 * skip contenteditable: false
 * prevent caret stuck inside contenteditable: false element
 */
function skipNonEditable() {
  const selection = window.getSelection()
  if (!selection || !selection.isCollapsed) return

  const node = selection.anchorNode
  const parent = selection.anchorNode?.parentNode

  if (
    parent instanceof HTMLElement
    && !parent.isContentEditable
  ) {
    selection.removeAllRanges()
    const range = document.createRange()
    range.setEndAfter(parent)
    range.setEndAfter(parent)
    range.collapse(false)
    selection.addRange(range)
  } /*  else if (
    node instanceof HTMLElement &&
    !node.isContentEditable
  ) {
    selection.removeAllRanges()
    const range = document.createRange()
    range.setEndAfter(node)
    range.setEndAfter(node)
    range.collapse(false)
    selection.addRange(range)
  } */
}

function insertNodeAtCaret(node: Node) {
  const selection = window.getSelection()
  if (!selection) return

  const range = selection.getRangeAt(selection.rangeCount - 1)
  range.deleteContents()
  range.insertNode(node)
  range.setStartAfter(node)
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
}

function getMentionsFromTarget(target: HTMLElement) {
  const mentions: string[] = []
  const nodes = target.querySelectorAll('[data-mention-id]')

  for (const node of nodes) {
    if (!(node instanceof HTMLElement)) continue
    const id = node.dataset.mentionId
    if (!id) return
    mentions.push(id)
  }

  return mentions
}

function getSelectionStartPosition() {
}

function getSelectionEndPosition() {
}

function getCaretPosition() {
}

function moveCaret(pos: number) {
}

function truncToMaxLength(target: HTMLElement, maxLength: number) {
  const length = target.innerText.length
  if (length <= maxLength) return

  target.innerText = target.innerText.slice(0, maxLength)
}

// https://bugzilla.mozilla.org/show_bug.cgi?id=1665167
