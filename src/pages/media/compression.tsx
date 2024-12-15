// use sharp or ffmpeg to compress image or video
// or convert image to webp format / video to webm/avif format
// remove image exif data or other metadata
// convert to webp / avif / jpegxl at same time to compare size and quality

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'
import type { FileInfo } from 'ffprobe-wasm'
import { FFprobeWorker } from 'ffprobe-wasm'

export default function Compression() {
  const [loaded, setLoaded] = useState(false)
  const [ffmpeg] = useState(() => new FFmpeg())
  const [file, setFile] = useState<File | null>(null)
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)

  useEffect(() => {
    return () => ffmpeg.terminate()
  }, [])

  const load = async () => {
    const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm'

    ffmpeg.on('log', ({ message, type }) => {
      console.log(type, message)
    })

    ffmpeg.on('progress', ({ progress, time }) => {
      console.log(progress, time)
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
    const worker = new FFprobeWorker()

    const fileInfo = await worker.getFileInfo(file)
    console.log(fileInfo)

    setFileInfo(fileInfo)
    // frames, duration, resolution, codec, bitrate, audio codec, audio bitrate
  }

  return (
    <div className="flex flex-col items-center">
      {loaded
        ? (
          <div className="self-stretch flex flex-col px-3 mt-4">
            {!file && (
              <div
                className="size-32 my-4 flex-center rounded-md border-dashed bg-dark-gray-700 border-dark-gray-50 border-2 mx-auto"
                onDragEnter={(e) => e.preventDefault()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  setFile(e.dataTransfer.files[0])
                  getVideoInfo(e.dataTransfer.files[0])
                }}
              >
                <div
                  className="rounded-[4px] cursor-pointer px-4 py-2 shadow-blue-600 bg-blue-400 text-white"
                  style={{
                    boxShadow: '0 5px 20px var(--tw-shadow-color)',
                  }}
                  onClick={() => {}}
                >
                  <span className="text-white">
                    Drop video
                  </span>
                </div>
              </div>
            )}
            {file
              && (
                <div className="flex flex-col gap-1 border-dark-gray-300 border border-solid px-2 py-2">
                  <div>
                    <span>
                      {file.name}
                    </span>
                  </div>
                  <div className="text-light-gray-800">{formatBytes(file.size)}</div>
                  {fileInfo && (
                    <div className="text-light-gray-800">
                      Duration: {formatDuration(fileInfo.format.duration)}
                    </div>
                  )}
                </div>
              )}

            <button className="mx-auto">transcode</button>
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

  return `${bytes.toFixed(2)}${labels[n]}`
}

function formatDuration(durationString: string) {
  const seconds = parseFloat(durationString)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)

  return `${hours}:${minutes}:${secs}.${ms}`
}
