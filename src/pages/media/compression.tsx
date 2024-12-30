// use sharp or ffmpeg to compress image or video
// or convert image to webp format / video to webm/avif format
// remove image exif data or other metadata
// convert to webp / avif / jpegxl at same time to compare size and quality

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import type { FileInfo } from 'ffprobe-wasm'
import { FFprobeWorker } from 'ffprobe-wasm'
import { builtinPlugins, optimize } from 'svgo/browser'

const test_svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
  <path d="M5.53331 12.8C5.53331 12.4686 5.80194 12.2 6.13331 12.2H9.86665C10.198 12.2 10.4666 12.4686 10.4666 12.8C10.4666 13.1314 10.198 13.4 9.86665 13.4H6.13331C5.80194 13.4 5.53331 13.1314 5.53331 12.8Z" fill="currentColor"/>
  <path d="M7.19998 2.6C6.86861 2.6 6.59998 2.86863 6.59998 3.2C6.59998 3.53137 6.86861 3.8 7.19998 3.8H8.79998C9.13135 3.8 9.39998 3.53137 9.39998 3.2C9.39998 2.86863 9.13135 2.6 8.79998 2.6H7.19998Z" fill="currentColor"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M6.74763 0.733338H9.25233C9.9026 0.733332 10.4271 0.733327 10.8518 0.768029C11.2891 0.803758 11.6732 0.879246 12.0286 1.06032C12.5931 1.34794 13.052 1.80688 13.3397 2.37137C13.5207 2.72674 13.5962 3.11085 13.632 3.54816C13.6667 3.97288 13.6667 4.49736 13.6666 5.14762V10.8524C13.6667 11.5026 13.6667 12.0271 13.632 12.4518C13.5962 12.8892 13.5207 13.2733 13.3397 13.6286C13.052 14.1931 12.5931 14.6521 12.0286 14.9397C11.6732 15.1208 11.2891 15.1962 10.8518 15.232C10.4271 15.2667 9.90262 15.2667 9.25236 15.2667H6.74761C6.09736 15.2667 5.57286 15.2667 5.14814 15.232C4.71083 15.1962 4.32672 15.1208 3.97134 14.9397C3.40686 14.6521 2.94791 14.1931 2.66029 13.6286C2.47922 13.2733 2.40373 12.8892 2.368 12.4518C2.3333 12.0271 2.33331 11.5026 2.33331 10.8524V5.14766C2.33331 4.49738 2.3333 3.97289 2.368 3.54816C2.40373 3.11085 2.47922 2.72674 2.66029 2.37137C2.94791 1.80688 3.40686 1.34794 3.97134 1.06032C4.32672 0.879246 4.71083 0.803758 5.14814 0.768029C5.57286 0.733327 6.09736 0.733332 6.74763 0.733338ZM5.24586 1.96404C4.88276 1.99371 4.67414 2.04901 4.51613 2.12953C4.17744 2.3021 3.90207 2.57746 3.7295 2.91615C3.64899 3.07417 3.59369 3.28278 3.56402 3.64588C3.53378 4.01599 3.53331 4.49137 3.53331 5.17334V10.8267C3.53331 11.5086 3.53378 11.984 3.56402 12.3541C3.59369 12.7172 3.64899 12.9258 3.7295 13.0839C3.90207 13.4225 4.17744 13.6979 4.51613 13.8705C4.67414 13.951 4.88276 14.0063 5.24586 14.036C5.61596 14.0662 6.09135 14.0667 6.77331 14.0667H9.22665C9.90861 14.0667 10.384 14.0662 10.7541 14.036C11.1172 14.0063 11.3258 13.951 11.4838 13.8705C11.8225 13.6979 12.0979 13.4225 12.2705 13.0839C12.351 12.9258 12.4063 12.7172 12.4359 12.3541C12.4662 11.984 12.4666 11.5086 12.4666 10.8267V5.17334C12.4666 4.49137 12.4662 4.01599 12.4359 3.64588C12.4063 3.28278 12.351 3.07417 12.2705 2.91615C12.0979 2.57746 11.8225 2.3021 11.4838 2.12953C11.3258 2.04901 11.1172 1.99371 10.7541 1.96404C10.384 1.9338 9.90861 1.93334 9.22665 1.93334H6.77331C6.09135 1.93334 5.61596 1.9338 5.24586 1.96404Z" fill="currentColor"/>
</svg>
`

export default function Compression() {
  const [loaded, setLoaded] = useState(false)
  const [ffmpeg] = useState(() => new FFmpeg())
  const [file, setFile] = useState<File | null>(null)
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)

  useEffect(() => {
    Reflect.set(window, 'svgo', optimize)

    const output = optimize(test_svg, {
      floatPrecision: 2,
      multipass: true,
      js2svg: {
        indent: 2,
        pretty: false,
      },
      plugins: [
        'preset-default',
        'removeTitle',
        'removeScripts',
        // remove xmlns if svg only used in html
        'removeXMLNS',
      ],
    })

    console.log(builtinPlugins.find((p) => p.name === 'preset-default'), output.data)

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

    await ffmpeg.writeFile(file.name, await fetchFile(file))
    await ffmpeg.ffprobe([
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      file.name,
      '-o',
      'output.txt',
    ])
    const data = await ffmpeg.readFile('output.txt')
    console.log('ffmpeg.ffprobe', data)
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
