import { CLEAR_EDITOR_COMMAND, LexicalEditor } from 'lexical'
import { InitialConfigType, LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin'

const initialConfig: InitialConfigType = {
  namespace: 'Lexical Editor',
  onError(error, editor) { },
}

export default function Editor() {
  const editorRef = useRef<LexicalEditor>(null)

  return (
    <div className='h-full bg-green-950'>
      <LexicalComposer initialConfig={initialConfig}>
        <PlainTextPlugin
          contentEditable={
            <ContentEditable className="outline-none cursor-text text-[14px] leading-[21px] px-[16px] py-[6px] resize-none transition-all" />
          }
          ErrorBoundary={LexicalErrorBoundary}
          placeholder={
            <div className="absolute text-#bbbbbe dark:text-#5e5e60 select-none pointer-events-none text-[14px] text-ellipsis whitespace-nowrap top-[6px] left-[16px]">
              {''}
            </div>
          }
        />
        {/* Add `CLEAR_EDITOR_COMMAND` command support */}
        <ClearEditorPlugin />
        {/* Undo Redo */}
        <HistoryPlugin />
        {/* expose editor instance */}
        <EditorRefPlugin editorRef={editorRef} />
      </LexicalComposer>
    </div>
  )
}