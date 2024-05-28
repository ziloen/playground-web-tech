/* eslint-disable unicorn/no-useless-undefined */
import { DndContext, DragOverlay, useDraggable, useDroppable, type Active } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { SVGProps } from 'react'

export default function DND() {
  const targetRef = useRef<HTMLDivElement>(null!)

  const [dropItems, setDropItems] = useState<{ kind: string; type: string }[]>([])
  const [dropFiles, setDropFiles] = useState<File[]>([])
  const [dropTypes, setDropTypes] = useState<string[]>([])

  useEffect(() => {
    const ac = new AbortController()
    const target = targetRef.current

    target.addEventListener('dragenter', e => {
      e.preventDefault()

      console.log(
        'dragenter',
        e
      )

      const { items, files, types } = logDataTransfer(e.dataTransfer)

      setDropItems(items)
      setDropFiles(files)
      setDropTypes(types)
    }, { signal: ac.signal })

    target.addEventListener('dragover', e => {
      e.preventDefault()
      // console.log('dragover', e)
    }, { signal: ac.signal })

    target.addEventListener('dragleave', e => {
      console.log('dragleave', e)
      setDropItems([])
    }, { signal: ac.signal })

    target.addEventListener('drop', e => {
      e.preventDefault()

      console.log(
        'drop',
        e
      )

      const { items, files, types } = logDataTransfer(e.dataTransfer)

      setDropItems(items)
      setDropFiles(files)
      setDropTypes(types)
    }, { signal: ac.signal })

    return () => ac.abort()
  }, [])

  const [dragActiveItem, setDragActiveItem] = useState<Active | null>(null)

  return (
    <DndContext
      onDragStart={e => {
        setDragActiveItem(e.active)
      }}
      onDragEnd={e => {
        setDragActiveItem(null)
      }}
    >
      <div className="relative size-full overflow-clip">
        <div ref={targetRef} className="size-[200px] rounded-[6px] bg-dark-gray-50">
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <span>items:</span>
            {dropItems.map(({ kind, type }, i) => <div key={i}>{kind} - {type}</div>)}
          </div>

          <div>
            <span>files:</span>
            {dropFiles.map((file, i) => (
              <div key={i}>
                {file.name} - {file.type}
                {file.size ? <span>- {file.size} bytes</span> : null}
              </div>
            ))}
          </div>

          <div>
            <span>types:</span>
            {dropTypes.map((type, i) => <div key={i}>{type}</div>)}
          </div>
        </div>

        <DragItem />

        <DeleteDropZone />

        <DragOverlay
          dropAnimation={{}}
          transition={() => {
            return undefined
          }}
        >
          {dragActiveItem
            ? (
              <div className="size-20 bg-dark-gray-100 rounded-sm cursor-grabbing">
              </div>
            )
            : null}
        </DragOverlay>
      </div>
    </DndContext>
  )
}

function MaterialSymbolsDeleteOutlineRounded(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M7 21q-.825 0-1.412-.587T5 19V6q-.425 0-.712-.288T4 5q0-.425.288-.712T5 4h4q0-.425.288-.712T10 3h4q.425 0 .713.288T15 4h4q.425 0 .713.288T20 5q0 .425-.288.713T19 6v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zm-7 11q.425 0 .713-.288T11 16V9q0-.425-.288-.712T10 8q-.425 0-.712.288T9 9v7q0 .425.288.713T10 17m4 0q.425 0 .713-.288T15 16V9q0-.425-.288-.712T14 8q-.425 0-.712.288T13 9v7q0 .425.288.713T14 17M7 6v13z"
      >
      </path>
    </svg>
  )
}

function DragItem() {
  const {
    activatorEvent,
    active,
    activeNodeRect,
    attributes,
    isDragging,
    listeners,
    node,
    over,
    setActivatorNodeRef,
    setNodeRef,
    transform,
  } = useDraggable({
    id: 'item',
  })

  return (
    <div
      className="size-20 bg-dark-gray-200 rounded-sm cursor-grab"
      ref={setNodeRef}
      {...listeners}
      {...attributes}
    >
    </div>
  )
}

function DeleteDropZone() {
  const {
    active,
    isOver,
    node,
    over,
    rect,
    setNodeRef,
  } = useDroppable({
    id: 'delete',
  })

  return (
    <div className="absolute right-0 bottom-0">
      <AnimatePresence>
        {active && active.id === 'item' && (
          <motion.div
            className={clsx('size-[100px] bg-red-700/45 flex items-end justify-end p-4')}
            ref={setNodeRef}
            initial={{ x: '100%', y: '100%' }}
            animate={{ x: 0, y: 0 }}
            exit={{ x: '100%', y: '100%', transition: { delay: 0.3, duration: 0.4 } }}
            style={{
              clipPath: 'polygon(0 100%,100% 0,100% 100%)',
              shapeOutside: 'polygon(0 100%,100% 0,100% 100%)',
              cursor: 'pointer',
            }}
            transition={{ type: 'tween' }}
          >
            <MaterialSymbolsDeleteOutlineRounded className="text-[28px]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function logDataTransfer(dataTransfer: DataTransfer | null) {
  if (dataTransfer === null) {
    return {
      files: [],
      items: [],
      types: [],
    }
  }

  const files = Array.from(dataTransfer.files)
  const items = Array.from(dataTransfer.items).map(({ kind, type }) => ({ kind, type }))
  const types = Array.from(dataTransfer.types)

  console.log({
    files,
    items,
    types,
  })

  return { files, items, types }
}
