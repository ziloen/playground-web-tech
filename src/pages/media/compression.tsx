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

  return (
    <div>
      {loaded
        ? (
          <div>
            <div></div>

            <button>transcode</button>
          </div>
        )
        : <button onClick={load}>load</button>}
    </div>
  )
}
