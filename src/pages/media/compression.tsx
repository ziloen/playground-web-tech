// use sharp or ffmpeg to compress image or video
// or convert image to webp format / video to webm/avif format
// remove image exif data or other metadata
// convert to webp / avif / jpegxl at same time to compare size and quality

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { useAsyncEffect } from 'ahooks'

export default function Compression() {
  const [loaded, setLoaded] = useState(false)
  const [ffmpeg] = useState(() => new FFmpeg())
  const [file, setFile] = useState<File | null>(null)

  const load = async () => {
    const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm'

    ffmpeg.on('log', ({ message }) => {
      console.log(message)
    })

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
    })

    setLoaded(true)
  }

  const transcode = async () => {
    // ffmpeg.writeFile()
  }

  const getVideoInfo = async (file: File) => {
    const u8 = await fetchFile(file)
    await ffmpeg.writeFile(file.name, u8)

    await ffmpeg.exec(['-i', file.name, '-f', 'ffmetadata', 'info.txt'])
    const info = await ffmpeg.readFile('info.txt')
    const infoText = await new Blob([info], { type: 'text/plain' }).text()
    console.log(infoText)

    // frames, duration, resolution, codec, bitrate, audio codec, audio bitrate
  }

  return (
    <div>
      {loaded
        ? (
          <div>
            <div
              className="size-32 border border-dashed border-green-700"
              onDragEnter={(e) => e.preventDefault()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                setFile(e.dataTransfer.files[0])
                getVideoInfo(e.dataTransfer.files[0])
              }}
            >
              <div>Drop video</div>
            </div>
            {file
              && (
                <div>
                  <div>
                    {/* <video controls src={URL.createObjectURL(file)} /> */}

                    <div>{file.name}</div>
                    <div>{formatBytes(file.size)}</div>
                  </div>
                </div>
              )}

            <ConfigForm />

            <button>transcode</button>
          </div>
        )
        : <button onClick={load}>load</button>}
    </div>
  )
}

function ConfigForm() {
  return (
    <div className="grid" style={{ gridTemplateColumns: 'max-content 1fr' }}>
      <div className="grid grid-cols-subgrid">
        <div>Video Codec</div>

        <div></div>
      </div>
    </div>
  )
}

function formatBytes(bytes: number) {
  const base = 1024
  let n = 0
  const labels = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB']

  while (bytes > base && n < labels.length - 1) {
    bytes /= base
    n++
  }

  return `${bytes.toFixed(2)} ${labels[n]}`
}
