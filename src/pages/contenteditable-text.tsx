

export default function ContentEditableText() {

  useEffect(() => {
    document.execCommand('defaultParagraphSeparator', false, 'br')
    document.execCommand('insertBrOnReturn', false, 'true')
  }, [])

  function plaintextEvent(e: React.ClipboardEvent | React.DragEvent) {
    console.log('plaintextEvent -> e', e)
    const nativeEvent = e.nativeEvent
    const dataInput = nativeEvent instanceof ClipboardEvent
      ? nativeEvent.clipboardData
      : nativeEvent.dataTransfer
    if (!dataInput) return
    const htmlOrigin = dataInput.getData('text/html')
    const textPlain = dataInput.getData('text/plain')

    if (htmlOrigin) {
      e.preventDefault()

      const lastRange = window.getSelection()?.getRangeAt(0)
      if (!lastRange) return
      const newNode = document.createTextNode(textPlain)
      lastRange.deleteContents()
      lastRange.insertNode(newNode)
      lastRange.setStartAfter(newNode)
      console.log('plaintextEvent -> textPlain', textPlain)
    }
  }

  return (
    <div className='grid h-full w-full grid-rows-[auto_1fr_auto]'>
      {/* add backdrop-filter blur */}
      <div className='border-b '>
        HAHSSHH
      </div>

      <div className=''>

      </div>

      {/* 1. paste and drop html to plaintext without contentEditbale="plaintext-only" */}
      {/* 2. drag to resize the height */}
      <div
        contentEditable
        suppressContentEditableWarning
        tabIndex={0}
        onPaste={plaintextEvent}
        onDrop={plaintextEvent}
        style={{ wordBreak: 'break-word' }}
        className='min-h-34px whitespace-pre-wrap h-max overflow-y-auto leading-17px border-t text-14px outline-none max-w-full'>
      </div>
    </div>
  )
}