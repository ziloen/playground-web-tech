import { fileOpen } from 'browser-fs-access'
import { noop } from 'es-toolkit'
import type { RefCallback } from 'react'
import { useMemoizedFn } from '~/hooks'
import { isInstanceofElement } from '~/utils'
import CarbonCamera from '~icons/carbon/camera'
import CarbonSkipBack from '~icons/carbon/skip-back'
import CarbonSkipForward from '~icons/carbon/skip-forward'

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

      {dropFiles.length > 0 && dropFiles[0].type.startsWith('video/') ? (
        <VideoPlayer file={dropFiles[0]} />
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}

function VideoPlayer({ file }: { file: File }) {
  const videoRef = useRef<HTMLVideoElement>(null!)
  const canvasRef = useRef<HTMLCanvasElement>(null!)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  // approximate frame interval in seconds, default 1/30
  const frameIntervalRef = useRef(1 / 30)

  // Create and revoke blob URL
  useEffect(() => {
    const url = URL.createObjectURL(file)
    setVideoUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Detect frame rate from video metadata
  const detectFrameRate = useMemoizedFn(() => {
    const video = videoRef.current
    if (!video) return

    // requestVideoFrameCallback is an experimental API not yet in TS dom types
    interface VideoWithRfc extends HTMLVideoElement {
      requestVideoFrameCallback(cb: VideoFrameRequestCallback): number
      cancelVideoFrameCallback(id: number): void
    }

    if (typeof (video as VideoWithRfc).requestVideoFrameCallback === 'function') {
      const v = video as VideoWithRfc
      let lastTime = 0
      let frameCount = 0
      let detected = false
      let handle = 0

      const callback: VideoFrameRequestCallback = (_now, metadata) => {
        if (detected) return
        if (lastTime !== 0 && metadata.mediaTime !== lastTime) {
          frameCount++
          if (frameCount >= 10) {
            const avgInterval = metadata.mediaTime / frameCount
            if (avgInterval > 0 && avgInterval < 1) {
              frameIntervalRef.current = Math.max(avgInterval, 1 / 120)
            }
            detected = true
            v.cancelVideoFrameCallback(handle)
            return
          }
        }
        lastTime = metadata.mediaTime
        handle = v.requestVideoFrameCallback(callback)
      }

      handle = v.requestVideoFrameCallback(callback)

      // Fallback timeout
      setTimeout(() => {
        if (!detected) {
          detected = true
          v.cancelVideoFrameCallback(handle)
        }
      }, 2000)
    }
  })

  const captureAndDownload = useMemoizedFn(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/png')

    const a = document.createElement('a')
    a.href = dataUrl
    const timestamp = formatTime(currentTime)
    const baseName = file.name.replace(/\.[^.]+$/, '')
    a.download = `${baseName}_${timestamp}.png`
    a.click()
  })

  const stepFrame = useMemoizedFn((direction: -1 | 1) => {
    const video = videoRef.current
    if (!video) return

    video.pause()

    const step = frameIntervalRef.current * direction
    const newTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + step))
    video.currentTime = newTime
    setCurrentTime(newTime)
  })

  const onTimeUpdate = useMemoizedFn(() => {
    setCurrentTime(videoRef.current.currentTime)
  })

  const onLoadedMetadata = useMemoizedFn(() => {
    detectFrameRate()
  })

  if (!videoUrl) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-dark-gray-400">{file.name}</div>

      <video
        ref={videoRef}
        src={videoUrl}
        controls
        className="max-h-[400px] max-w-full"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
      />

      {/* Frame nav & capture buttons */}
      <div className="flex items-center gap-3">
        <button
          className="flex-center size-9"
          onClick={() => stepFrame(-1)}
          aria-label="上一帧"
          title="上一帧"
        >
          <CarbonSkipBack />
        </button>

        <button
          className="flex-center size-9"
          onClick={() => stepFrame(1)}
          aria-label="下一帧"
          title="下一帧"
        >
          <CarbonSkipForward />
        </button>

        <button
          className="flex-center size-9"
          onClick={captureAndDownload}
          aria-label="截取并下载当前帧"
          title="截取并下载当前帧"
        >
          <CarbonCamera />
        </button>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`
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
