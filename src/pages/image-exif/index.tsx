import { load } from 'exifreader'

// https://github.com/mattiasw/ExifReader

export default function ImageEXIF() {
  const [exifStr, setExifStr] = useState('')

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    file.arrayBuffer().then((buffer) => {
      const exifData = load(buffer)
      setExifStr(JSON.stringify(exifData, null, 2))
    })
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={onChange} />

      <p
        style={{
          overflowWrap: 'break-word',
          whiteSpace: 'pre-wrap',
          lineBreak: 'auto',
        }}
      >
        {exifStr}
      </p>
    </div>
  )
}
