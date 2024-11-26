import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import type { SVGProps } from 'react'

// Grid Drag and Drop
// Swapping items when drag over another item
// Change order when drag over between items

export default function DND() {
  const targetRef = useRef<HTMLDivElement>(null!)

  const [dropItems, setDropItems] = useState<{ kind: string; type: string }[]>([])
  const [dropFiles, setDropFiles] = useState<File[]>([])
  const [dropTypes, setDropTypes] = useState<string[]>([])

  useEffect(() => {
    const ac = new AbortController()
    const target = targetRef.current

    target.addEventListener('dragenter', (e) => {
      e.preventDefault()

      console.log(
        'dragenter',
        e,
      )

      const { items, files, types } = logDataTransfer(e.dataTransfer)

      setDropItems(items)
      setDropFiles(files)
      setDropTypes(types)
    }, { signal: ac.signal })

    target.addEventListener('dragover', (e) => {
      e.preventDefault()
      // console.log('dragover', e)
    }, { signal: ac.signal })

    target.addEventListener('dragleave', (e) => {
      console.log('dragleave', e)
      setDropItems([])
    }, { signal: ac.signal })

    target.addEventListener('drop', (e) => {
      e.preventDefault()

      console.log(
        'drop',
        e,
      )

      const { items, files, types } = logDataTransfer(e.dataTransfer)

      setDropItems(items)
      setDropFiles(files)
      setDropTypes(types)
    }, { signal: ac.signal })

    target.addEventListener('paste', (e) => {
      console.log('paste', e)
      const { items, files, types } = logDataTransfer(e.clipboardData)

      setDropItems(items)
      setDropFiles(files)
      setDropTypes(types)
    }, { signal: ac.signal })

    return () => ac.abort()
  }, [])

  return (
    <div className="relative size-full overflow-clip">
      <div
        ref={targetRef}
        tabIndex={0}
        className="size-[200px] focus:outline-blue-400 focus:outline focus:outline-1 rounded-[6px] bg-dark-gray-50"
      >
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

        <div>
          <button
            onClick={() => {
              if (!dropFiles.length) return
              const file = dropFiles[0]
              const url = URL.createObjectURL(file)
              const a = document.createElement('a')
              a.href = url
              a.download = file.name
              a.click()
              URL.revokeObjectURL(url)
            }}
          >
            DOwnload
          </button>
        </div>
      </div>

      <Grid />

      <DeleteDropZone />
    </div>
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

function DeleteDropZone() {
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    return monitorForElements({
      onDragStart() {
        setIsDragging(true)
      },
      onDrop: () => setIsDragging(false),
    })
  }, [])

  return (
    <div className="absolute right-0 bottom-0">
      <AnimatePresence>
        {isDragging
          && (
            <motion.div
              className={clsx('size-[100px] bg-red-700/45 flex items-end justify-end p-4')}
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

function getInitItems() {
  return [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
  ]
}

function Grid() {
  const [items, setItems] = useState(getInitItems)

  useEffect(() => {
    return monitorForElements({
      onDrop({ location, source }) {
        const destination = location.current.dropTargets[0]
        if (!destination) return

        const destinationItem = destination.data.value
        const souceItem = source.data.value

        if (typeof destinationItem !== 'string' || typeof souceItem !== 'string') return

        const destinationIndex = items.indexOf(destinationItem)
        const sourceIndex = items.indexOf(souceItem)

        const newItems = [...items]
        newItems[destinationIndex] = souceItem
        newItems[sourceIndex] = destinationItem
        setItems(newItems)
      },
    })
  }, [items])

  return (
    <div
      className="grid resizable"
      style={{
        gridTemplateColumns: 'repeat(auto-fit, 100px)',
        gridAutoRows: '100px',
        justifyItems: 'center',
        alignItems: 'center',
      }}
    >
      {items.map((item, i) => <Item key={item} items={items} value={item} />)}
    </div>
  )
}

function Item({ value, items }: { value: string; items: string[] }) {
  const ref = useRef<HTMLDivElement>(null!)
  const [state, setState] = useState<
    'idle' | 'dragging' | 'drag-over'
  >('idle')

  useEffect(() => {
    return combine(
      draggable({
        element: ref.current,
        getInitialData: () => ({ value }),
        onDragStart: () => setState('dragging'),
        onDrop: () => setState('idle'),
      }),
      dropTargetForElements({
        element: ref.current,
        canDrop({ element, input, source }) {
          return source.data.value !== value
        },
        getData: () => ({ value }),
        onDragEnter: () => setState('drag-over'),
        onDragLeave: () => setState('idle'),
        onDrop: () => setState('idle'),
      }),
    )
  }, [value])

  return (
    <motion.div
      layout
      layoutDependency={items}
      ref={ref}
      className={clsx(
        'size-20 rounded-full flex-center',
        state === 'idle' && 'bg-dark-gray-200',
        state === 'dragging' && 'bg-dark-gray-200 opacity-50',
        state === 'drag-over' && 'bg-dark-gray-400',
      )}
    >
      {value}
    </motion.div>
  )
}
