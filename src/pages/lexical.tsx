import { CLEAR_EDITOR_COMMAND, LexicalEditor } from 'lexical'
import { InitialConfigType, LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin'
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin'
import { LexicalTypeaheadMenuPlugin, MenuOption, useBasicTypeaheadTriggerMatch, useDynamicPositioning } from '@lexical/react/LexicalTypeaheadMenuPlugin'

const initialConfig: InitialConfigType = {
  namespace: 'Lexical Editor',
  onError(error, editor) { },
}

export default function Editor() {
  const editorRef = useRef<LexicalEditor>(null)

  function clearEditor() {
    const editor = editorRef.current
    if (!editor) return

    editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined)
  }

  const options: MenuOption[] = useMemo(() => {
    return [
      new MenuOption("o1"),
      new MenuOption("o2"),
      new MenuOption("o3"),
    ]
  }, [])


  return (
    <div className='h-full px-12px py-12px flex flex-col gap-12px'>
      <div className='relative'>
        <LexicalComposer initialConfig={initialConfig}>
          <PlainTextPlugin
            contentEditable={
              <ContentEditable className="outline-none z-1 focus:outline-green cursor-text text-[14px] leading-[21px] px-[16px] py-[6px] resize-none transition-all" />
            }
            ErrorBoundary={LexicalErrorBoundary}
            placeholder={
              <div className="absolute text-#bbbbbe dark:text-#5e5e60 select-none pointer-events-none text-14px text-ellipsis whitespace-nowrap top-6px left-16px">
                {'Placeholder'}
              </div>
            }
          />

          <LexicalTypeaheadMenuPlugin
            menuRenderFn={(anchorElementRef, itemProps, matchingString) => {
              return <div></div>
            }}
            onQueryChange={matchingString => {}}
            onSelectOption={(option, textNodeContainingQuery, closeMenu, matchingString) => {}}
            options={options}
            triggerFn={() => null}
          />

          {/* Add `CLEAR_EDITOR_COMMAND` command support */}
          <ClearEditorPlugin />
          {/* Undo Redo */}
          <HistoryPlugin />
          {/* expose editor instance */}
          <EditorRefPlugin editorRef={editorRef} />
        </LexicalComposer>
      </div>

      <div>
        <button className='btn' onClick={clearEditor}>Clear</button>
      </div>
    </div>
  )
}