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

  return (
    <div>
      <div ref={targetRef} className="size-[200px] rounded-[6px] bg-gray">
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <span>items:</span>
          {dropItems.map(({ kind, type }, i) => <div key={i}>{kind} - {type}</div>)}
        </div>

        <div>
          <span>files:</span>
          {dropFiles.map((file, i) => <div key={i}>{file.name} - {file.type} - {file.size}</div>)}
        </div>

        <div>
          <span>types:</span>
          {dropTypes.map((type, i) => <div key={i}>{type}</div>)}
        </div>
      </div>
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
