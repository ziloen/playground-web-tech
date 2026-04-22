import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { fileOpen } from 'browser-fs-access'
import { noop } from 'es-toolkit'
import type { RefCallback } from 'react'
import { useMemoizedFn } from '~/hooks'
import { isInstanceofElement } from '~/utils'
import CarbonTrashCan from '~icons/carbon/trash-can'

// Grid Drag and Drop
// Swapping items when drag over another item
// Change order when drag over between items

export default function DND() {
  const [dropItems, setDropItems] = useState<{ kind: string; type: string }[]>([])
  const [dropFiles, setDropFiles] = useState<File[]>([])
  const [dropTypes, setDropTypes] = useState<string[]>([])

  const onDrop = useMemoizedFn((data: DataTransfer | FileList | File | null | undefined) => {
    if (!data) {
      setDropFiles([])
      setDropItems([])
      setDropTypes([])
    } else if (data instanceof DataTransfer) {
      const { items, files, types } = logDataTransfer(data)
      setDropItems(items)
      setDropFiles(files)
      setDropTypes(types)
    } else if (data instanceof FileList) {
      const files = Array.from(data)
      setDropFiles(files)
      setDropItems([])
      setDropTypes([])
    } else if (data instanceof File) {
      setDropFiles([data])
      setDropItems([])
      setDropTypes([])
    }
  })

  const openFilePicker = useMemoizedFn(async () => {
    const file = await fileOpen({
      multiple: false,
      mimeTypes: [],
      excludeAcceptAllOption: true,
    })
      // Ignore user cancel
      .catch(noop)

    file && onDrop(file)
  })

  const dropZoneRef = useMemoizedFn<RefCallback<HTMLDivElement>>((el) => {
    if (!el) return

    const ac = new AbortController()
    const signal = ac.signal

    el.addEventListener(
      'dragenter',
      (e) => {
        console.log(e.type)

        if (!e.dataTransfer) return

        // FIXME: 需要在 MacOS 特殊处理 web image text/uri-list
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault()
        }

        onDrop(e.dataTransfer)
      },
      { signal },
    )

    el.addEventListener(
      'dragover',
      (e) => {
        if (!e.dataTransfer) return

        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault()
        }
      },
      { signal },
    )

    el.addEventListener(
      'dragleave',
      (e) => {
        console.log(e.type)

        if (
          !e.relatedTarget ||
          !(isInstanceofElement(e.relatedTarget, Element) && el.contains(e.relatedTarget))
        ) {
          setDropItems([])
        }
      },
      { signal },
    )

    el.addEventListener(
      'drop',
      (e) => {
        console.log(e.type)

        if (!e.dataTransfer) return
        if (!e.dataTransfer.files.length) return

        e.preventDefault()

        onDrop(e.dataTransfer)
      },
      { signal },
    )

    window.addEventListener(
      'paste',
      (e) => {
        console.log(e.type)
        e.clipboardData && onDrop(e.clipboardData)
      },
      { signal },
    )

    return () => {
      ac.abort()
    }
  })

  return (
    <div className="relative size-full overflow-clip">
      {/* FIXME: Add drag over outline/border */}
      <div ref={dropZoneRef} className="size-[200px] rounded-[6px] bg-dark-gray-50">
        <textarea
          onPaste={(e) => {
            onDrop(e.clipboardData)
          }}
        />

        <button onClick={openFilePicker}>Open File Picker</button>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <span>items:</span>
          {dropItems.map(({ kind, type }, i) => (
            <div key={i}>
              {kind} - {type}
            </div>
          ))}
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
          {dropTypes.map((type, i) => (
            <div key={i}>{type}</div>
          ))}
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
            Download
          </button>
        </div>
      </div>

      <Grid />

      <DeleteDropZone />
    </div>
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
        {isDragging && (
          <motion.div
            className={clsx('flex size-[100px] items-end justify-end bg-red-700/45 p-4')}
            initial={{ x: '100%', y: '100%' }}
            animate={{ x: 0, y: 0 }}
            exit={{
              x: '100%',
              y: '100%',
              transition: { delay: 0.3, duration: 0.4 },
            }}
            style={{
              clipPath: 'polygon(0 100%,100% 0,100% 100%)',
              shapeOutside: 'polygon(0 100%,100% 0,100% 100%)',
              cursor: 'pointer',
            }}
            transition={{ type: 'tween' }}
          >
            <CarbonTrashCan className="text-[28px]" />
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
  const items = Array.from(dataTransfer.items).map(({ kind, type }) => ({
    kind,
    type,
  }))
  const types = Array.from(dataTransfer.types)

  const values = items.reduce<Record<string, string>>((previousValue, currentValue) => {
    const type = currentValue.type
    const value = dataTransfer.getData(type)
    previousValue[type] = value
    // Firefox bookmarks
    // https://github.com/mozilla-firefox/firefox/blob/main/toolkit/components/places/PlacesUtils.sys.mjs
    if (type === 'text/x-moz-place' && value) {
      const json = JSON.parse(value) as Record<string, unknown>
      console.log(json.type, json)
    } else if (type === 'text/html' && value && types.includes('text/x-moz-place')) {
      const folder = parseFirefoxBookmarkHtml(value)
      console.log('bookmark folder:', folder)
    }

    return previousValue
  }, {})

  console.log(
    structuredClone({
      files,
      items,
      types,
      values,
    }),
  )

  return { files, items, types }
}

function getInitItems() {
  return ['1', '2', '3', '4', '5', '6']
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
      {items.map((item, i) => (
        <Item key={item} items={items} value={item} />
      ))}
    </div>
  )
}

function Item({ value, items }: { value: string; items: string[] }) {
  const ref = useRef<HTMLDivElement>(null!)
  const [state, setState] = useState<'idle' | 'dragging' | 'drag-over'>('idle')

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
        'flex-center size-20 rounded-full',
        state === 'idle' && 'bg-dark-gray-200',
        state === 'dragging' && 'bg-dark-gray-200 opacity-50',
        state === 'drag-over' && 'bg-dark-gray-400',
      )}
    >
      {value}
    </motion.div>
  )
}

type Folder = {
  type: 'folder'
  title: string
  children: (Folder | Bookmark | Separator)[]
}

type Bookmark = {
  type: 'bookmark'
  title: string
  url: string
}

type Separator = {
  type: 'separator'
}

function parseFirefoxBookmarkHtml(
  /**
   * ```html
   * <DL>
   *   <DT>Folder Name</DT>
   *
   *   <DD>
   *     <A HREF="https://example.com">Example</A>
   *   </DD>
   *
   *   <DD>
   *     <HR>
   *   </DD>
   *
   *   <DD>
   *     <DL>
   *       <DT>Sub Folder</DT>
   *
   *       <DD>
   *         <A HREF="https://example2.com">Example 2</A>
   *       </DD>
   *     </DL>
   *   </DD>
   * </DL>
   * ```
   */
  html: string,
): Folder | null {
  const doc = Document.parseHTMLUnsafe(html)
  const dl = doc.querySelector('dl')
  if (!dl) return null

  return parseDL(dl)
}

function parseDL(dl: HTMLDListElement): Folder {
  const title = dl.querySelector(':scope > dt')?.textContent?.trim() ?? ''
  const children: (Folder | Bookmark | Separator)[] = []

  for (const el of dl.querySelectorAll(':scope > dd > :where(hr, dl, a)')) {
    if (el instanceof HTMLHRElement) {
      children.push({ type: 'separator' })
    } else if (el instanceof HTMLDListElement) {
      children.push(parseDL(el))
    } else if (el instanceof HTMLAnchorElement) {
      children.push({
        type: 'bookmark',
        title: el.textContent?.trim() ?? '',
        url: el.getAttribute('href')?.trim() ?? '',
      })
    }
  }

  return { type: 'folder', title, children }
}
