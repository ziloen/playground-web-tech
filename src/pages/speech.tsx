import ffmpegWasmUrl from '@ffmpeg/core-mt/wasm?url'
import ffmpegCoreUrl from '@ffmpeg/core-mt?url'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { asNonNullable, asType } from '@wai-ri/core'
import { Select as AntdSelect } from 'antd'
import type { DefaultOptionType } from 'antd/es/select'
import { useTransform, type MotionValue } from 'motion/react'
import { memo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
} from '~/components/Select'
import Slider from '~/components/Slider'
import { useGetState, useMemoizedFn, useNextEffect } from '~/hooks'
import { LRUCache } from '~/utils'
import CarbonCloud from '~icons/carbon/cloud'

const defaultZhText =
  `从零开始学习 Web 开发极具挑战性，该教程将为你提供详细的资料，手把手帮助你轻松愉快地学习。无论你是正在学习 Web 开发的学生（自学或参与课程）、寻找材料的老师、编程爱好者，亦或是仅仅想了解一点点 Web 技术，我们都希望你能感到宾至如归。`

const defaultEnText =
  `If you are a complete beginner, web development can be challenging — we will hold your hand and provide enough detail for you to feel comfortable and learn the topics properly. You should feel at home whether you are a student learning web development (on your own or as part of a class), a teacher looking for class materials, a hobbyist, or someone who just wants to understand more about how web technologies work.`

interface VoiceOption extends DefaultOptionType {
  voice: SpeechSynthesisVoice
}

interface VoiceOptionGroup extends DefaultOptionType {
  options: VoiceOption[]
}

// @ts-expect-error navigator has no type
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const isChrome = navigator.userAgentData
  // @ts-expect-error navigator has no type
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  && navigator.userAgentData.brands.some((brand) => brand.brand === 'Google Chrome')

export default function WebSpeechAPIPage() {
  const [inputText, setInputText, getInputText] = useGetState(defaultZhText)
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const nextEffect = useNextEffect()
  const [voiceList, setVoiceList] = useState<SpeechSynthesisVoice[] | null>(() => {
    const list = speechSynthesis.getVoices()

    if (list.length) return list

    speechSynthesis.addEventListener('voiceschanged', (e) => {
      nextEffect(() => setVoiceList(speechSynthesis.getVoices()))
    }, { once: true })

    return null
  })
  const [pitch, setPitch, getPitch] = useGetState(1)
  const [lang, setLang, getLang] = useGetState('zh-CN')
  const [volume, setVolume, getVolume] = useGetState(1)
  const [rate, setRate, getRate] = useGetState(1)

  const groupByLang = useMemo(() => {
    if (!voiceList) return null
    return Object.groupBy(voiceList, (voice) => voice.lang)
  }, [voiceList])

  const options = useMemo<VoiceOptionGroup[]>(() => {
    if (!groupByLang) return []

    return Object.entries(groupByLang).map(([lang, voices]) => {
      asNonNullable(voices)

      return {
        label: <span>{lang}</span>,
        title: lang,
        options: voices.map((voice) => ({
          value: voice.name,
          label: voice.name,

          voice,
        })),
      }
    })
  }, [groupByLang])

  const pausedRef = useRef(false)
  const startedRef = useRef(false)
  const [loading, setLoading, getLoading] = useGetState(false)
  const [active, setActive, getActive] = useGetState<SpeechSynthesisVoice | null>(null)
  const [playing, setPlaying, getPlaying] = useGetState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    if (isChrome) {
      timer = setInterval(() => {
        if (speechSynthesis.speaking && !pausedRef.current) {
          console.log('Chrome bug fix')
          speechSynthesis.pause()
          speechSynthesis.resume()
        }
      }, 12_000)
    }

    return () => {
      startedRef.current = false
      pausedRef.current = false
      speechSynthesis.cancel()
      clearInterval(timer)
    }
  }, [])

  const utterance = useMemo<SpeechSynthesisUtterance>(() => {
    const utterance = new SpeechSynthesisUtterance()

    utterance.addEventListener('boundary', (e) => {
      console.log('boundary')
    })

    utterance.addEventListener('start', (e) => {
      console.log('%c▶', 'color: #28e172;', 'start')

      startedRef.current = true
      // pause before start will not work, check paused status when start
      if (isChrome && pausedRef.current) {
        console.log('pause after start')
        speechSynthesis.pause()
      }
    })

    utterance.addEventListener('end', (e) => {
      console.log('end')
      pausedRef.current = false
      startedRef.current = false
    })

    utterance.addEventListener('error', (e) => {
      console.log('❌', 'error', e.error)
      startedRef.current = false
      pausedRef.current = false
    })

    utterance.addEventListener('pause', (e) => {
      console.log('pause')
    })

    utterance.addEventListener('resume', (e) => {
      console.log('resume')
    })

    utterance.addEventListener('mark', (e) => {
      console.log('mark')
    })

    return utterance
  }, [])

  const onSpeek = useMemoizedFn(() => {
    speak()
  })

  const speak = useMemoizedFn(() => {
    const voice = voiceList?.find((voice) => voice.name === selectedVoice) ?? null
    utterance.voice = voice
    utterance.text = getInputText()
    utterance.lang = getLang()
    utterance.pitch = getPitch()
    utterance.volume = getVolume()
    utterance.rate = getRate()

    if (speechSynthesis.speaking) {
      console.log('cancel previous speech')
      speechSynthesis.cancel()
    }

    speechSynthesis.speak(utterance)
    console.log('%c▶', 'color: #cdd64f;', 'speak')
    pausedRef.current = false
    startedRef.current = false
    setLoading(true)
    setActive(voice)
  })

  const pause = useMemoizedFn(() => {
    if (!speechSynthesis.speaking) return
    speechSynthesis.pause()
    console.log('🔘', 'pause')
    pausedRef.current = true
  })

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const [recogText, setRecogText, getRecogText] = useGetState('')
  const [recogError, setRecogError] = useState('')
  const [recording, setRecording, getRecording] = useGetState(false)
  const [resultText, setResultText, getResultText] = useGetState('')

  return (
    <main>
      <h1>Web Speech API</h1>

      <div
        className="grid gap-x-3 gap-y-2"
        style={{
          gridTemplateColumns: 'max-content minmax(max-content, 200px)',
          gridAutoRows: 'min-content',
        }}
      >
        <div className="grid grid-cols-subgrid col-span-full">
          <span>voice</span>
          <AntdSelect<string, VoiceOptionGroup>
            showSearch
            className="min-w-40"
            virtual={false}
            value={selectedVoice}
            styles={{
              popup: {
                root: {
                  maxHeight: '400px',
                },
              },
            }}
            onChange={setSelectedVoice}
            popupMatchSelectWidth={false}
            optionRender={({ data }) => {
              asType<VoiceOption>(data)
              return (
                <div className="flex items-center gap-2 min-w-max shrink-0">
                  <span>{data.voice.name}</span>
                  {!data.voice.localService && (
                    <CarbonCloud className="text-lg shrink-0 text-blue-600" />
                  )}
                </div>
              )
            }}
            options={options}
          />
        </div>

        {groupByLang && (
          <div className="grid grid-cols-subgrid col-span-full">
            <span>lang</span>

            <Select
              value={lang}
              onValueChange={(lang) => {
                setLang(lang)
                if (lang === 'en-US') {
                  setInputText(defaultEnText)
                }
              }}
            >
              <SelectTrigger>
                <div>{lang}</div>
              </SelectTrigger>

              <SelectContent>
                {Object.keys(groupByLang).map((lang) => {
                  return (
                    <SelectItem key={lang} value={lang}>
                      <SelectItemText>{lang}</SelectItemText>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-subgrid col-span-full">
          <span>pitch</span>
          <Slider
            value={pitch}
            onChange={(e) => {
              setPitch(+e.currentTarget.valueAsNumber)

              if (speechSynthesis.speaking) {
                onSpeek()
              }
            }}
            min={0}
            max={2}
            step={0.01}
          />
        </div>

        <div className="grid grid-cols-subgrid col-span-full">
          <span>volume</span>
          <Slider
            value={volume}
            onChange={(e) => {
              setVolume(e.currentTarget.valueAsNumber)

              if (speechSynthesis.speaking) {
                onSpeek()
              }
            }}
            min={0}
            max={1}
            step={0.01}
          />
        </div>

        <div className="grid grid-cols-subgrid col-span-full">
          <span>rate</span>
          <Slider
            value={rate}
            onChange={(e) => {
              setRate(e.currentTarget.valueAsNumber)

              if (speechSynthesis.speaking) {
                onSpeek()
              }
            }}
            min={0.1}
            max={10}
            step={0.1}
          />
        </div>
      </div>

      <textarea
        className="max-w-[600px] w-[min(100%,600px)] min-h-[3lh] field-sizing-content m-0 p-0 box-content"
        value={inputText}
        onChange={(e) => setInputText(e.currentTarget.value)}
      />

      <br />

      <button onClick={onSpeek}>
        Speak
      </button>

      <button
        onClick={(e) => {
          pausedRef.current = false
          startedRef.current = true
          speechSynthesis.cancel()
          console.log('🟡', 'cancel')
        }}
      >
        Cancel
      </button>

      <br />

      <button
        onClick={(e) => {
          console.log('before pause')
          // pause before start will not work
          if (startedRef.current) {
            speechSynthesis.pause()
          } else {
            if (isChrome) {
              console.log("pause before start, won't work")
            } else {
              speechSynthesis.pause()
            }
          }
          pausedRef.current = true
          console.log('after pause')
        }}
      >
        Pause
      </button>

      <button
        onClick={() => {
          console.log('before resume')
          pausedRef.current = false
          speechSynthesis.resume()
          console.log('after resume')
        }}
      >
        Resume
      </button>

      <div className="grid">
        <div className="grid-cols-subgrid">
        </div>
      </div>

      <table className="border-collapse">
        <thead className="p-[10px]">
          <tr className="text-center">
            <th className="px-2 py-1">Status</th>
            <th className="px-2 py-1">Active</th>
            <th className="px-2 py-1">Loading</th>
            <th className="px-2 py-1">Playing</th>
          </tr>
        </thead>

        <tbody style={{ textAlign: 'center', color: '#d19a54' }}>
          <tr>
            <td>{loading ? '' : ''}</td>
            <td>{active ? active.name : 'null'}</td>
            <td>{loading.toString()}</td>
            <td>{playing.toString()}</td>
          </tr>
        </tbody>
      </table>

      <button
        onClick={(e) => {
          if (recording) {
            setRecording(false)
            recognitionRef.current?.stop()
            return
          }

          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
          if (SpeechRecognition) {
            recognitionRef.current?.stop()
            setRecogText('')
            const recognition = recognitionRef.current = new SpeechRecognition()

            recognition.continuous = true
            recognition.lang = lang
            recognition.interimResults = true

            let error: SpeechRecognitionErrorCode | '' = ''
            let lastStartTime = 0

            recognition.addEventListener('error', (e) => {
              console.log('error', e)
              setRecogError(e.error)
              error = e.error
            })

            recognition.addEventListener('start', (e) => {
              lastStartTime = Date.now()
              console.log('start', e)
            })

            recognition.addEventListener('nomatch', (e) => {
              console.log('nomatch', e)
            })

            recognition.addEventListener('result', (e) => {
              console.log('result', e.results)
              let text = ''
              for (const result of e.results) {
                for (const alternative of result) {
                  text += alternative.transcript

                  if (result.isFinal) {
                    text += ' '
                  }
                }
              }

              setRecogText(text)
            })

            recognition.addEventListener('end', (e) => {
              console.log('end', e)

              const duration = Date.now() - lastStartTime
              const atLeast = 1000

              if (
                getRecording()
                && duration > atLeast
                && !['not-allowed', 'network'].includes(error)
              ) {
                setRecording(true)
                recognition.start()
              } else {
                setResultText(getResultText() + getRecogText())
                setRecording(false)
              }
            })

            recognition.addEventListener('audiostart', (e) => {
              console.log('audiostart', e)
            })

            recognition.addEventListener('audioend', (e) => {
              console.log('audioend', e)
            })

            recognition.addEventListener('soundstart', (e) => {
              console.log('soundstart', e)
            })

            recognition.addEventListener('soundend', (e) => {
              console.log('soundend', e)
            })

            recognition.addEventListener('speechstart', (e) => {
              console.log('speechstart', e)
            })

            recognition.addEventListener('speechend', (e) => {
              console.log('speechend', e)
            })

            recognition.start()
            setRecording(true)
          }
        }}
      >
        {recording ? '🟥' : '🎤'}
      </button>

      <span>{recogText}</span>

      <div>{resultText}</div>

      <div className="text-red-400">
        {recogError}
      </div>

      <AudioVisualization />
    </main>
  )
}

function useRecognition() {
  const [recording, setRecording, getRecording] = useGetState(false)

  const ref = useRef<SpeechRecognition | null>(null)

  const startRecord = useMemoizedFn(() => {
    ref.current?.stop()
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = ref.current = new SpeechRecognition()
    recognition.interimResults = true
    recognition.continuous = true
    recognition.lang = 'zh-Hans'

    recognition.addEventListener('audioend', (e) => {
      console.log('audioend', e)
    })

    recognition.start()
  })

  const endRecord = useMemoizedFn(() => {
    setRecording(false)
    ref.current?.stop()
  })

  return {
    recording,
    startRecord,
    endRecord,
  }
}

type AudioSegment = {
  volume: number
}

function AudioVisualization() {
  const [visualizationData, setVisualizationData, getVisualizationData] = useGetState(() =>
    new LRUCache<number, AudioSegment>(200)
  )

  const [startTime, setStartTime] = useState(Infinity)
  const [now, nowMV] = useNow()
  const [recording, setRecording] = useState(false)
  const stopTimeMV = useMotionValue(0)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)

  const startRecording = useMemoizedFn(async () => {
    const stream = streamRef.current = await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: 0,
        height: 0,
        frameRate: 0,
        displaySurface: 'monitor',
      },
      audio: {
        // @ts-expect-error navigator has no type
        suppressLocalAudioPlayback: false,
      },
      systemAudio: 'include',
    })

    // disable video
    stream.getVideoTracks().forEach((track) => track.stop())

    const audioCtx = new AudioContext()
    const analyser = audioCtx.createAnalyser()
    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)
    analyser.fftSize = 2048

    const mimeType = 'audio/webm;codecs=opus'

    const mediaRecorder = recorderRef.current = new MediaRecorder(stream, {
      mimeType: mimeType,
      audioBitsPerSecond: 128_000,
    })

    const chunks: Blob[] = []

    const startTime = Date.now()

    mediaRecorder.addEventListener('dataavailable', (e) => {
      console.log(e.type, e, e.data)
      chunks.push(e.data)
    })

    mediaRecorder.addEventListener('stop', async (e) => {
      console.log(e.type, e)

      if (mediaRecorder.state === 'inactive') {
        const blob = await webmToMp3(new Blob(chunks, { type: mimeType }))
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'audio.mp3'
        a.click()
        URL.revokeObjectURL(url)
      }
    })

    mediaRecorder.addEventListener('error', (e) => {
      console.log(e.type, e)
    })

    mediaRecorder.start()
    setStartTime(startTime)
    setRecording(true)
    visualize(analyser)
  })

  const stopRecording = useMemoizedFn(() => {
    stopTimeMV.set(now)
    setRecording(false)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    recorderRef.current?.stop()
    recorderRef.current = null
  })

  const visualize = useMemoizedFn((analyser: AnalyserNode) => {
    const update = () => {
      const frequencyData = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(frequencyData)

      let sum = 0

      for (const frequency of frequencyData) {
        sum += frequency
      }

      const level = sum / frequencyData.length

      const now = Date.now()
      const nearest = Math.floor(now / 125) * 125

      getVisualizationData().set(nearest, {
        volume: level,
      })

      requestAnimationFrame(update)
    }

    requestAnimationFrame(update)
  })

  const end = useMemo(() => {
    if (recording) {
      return (Math.floor(now / 125)) * 125
    } else {
      return (Math.floor(stopTimeMV.get() / 125)) * 125
    }
  }, [now, recording])

  const children = useMemo(() => {
    const result = []

    // length 150
    for (let i = 149; i >= 0; i--) {
      const t = end - (i * 125)

      result.push(
        <WaveItem
          key={t}
          nowMV={nowMV}
          stopTimeMV={stopTimeMV}
          startTime={startTime}
          recording={recording}
          t={t}
          visualizationData={visualizationData}
        />,
      )
    }

    return result
  }, [end, recording])

  return (
    <div className="w-[600px] bg-white">
      <button onClick={() => recording ? stopRecording() : startRecording()}>
        {recording ? '🔴' : '🎙'}
      </button>

      <div
        className="h-8 w-[600px] flex items-center gap-0.5 overflow-visible relative transition-all duration-200"
        style={{
          maskPosition: recording ? '0% 0%, 0% 0%' : '-32px 0%, 32px 0%',
          maskImage:
            'linear-gradient(to right, transparent, #000 11%, black 89%, transparent 89%), linear-gradient(to left, transparent, #000 11%, #000 89%, transparent 89%)',
          maskRepeat: 'no-repeat',
        }}
      >
        {children}
      </div>
    </div>
  )
}

const WaveItem = /* #__PURE__ */ memo(function WaveItem(
  {
    t,
    visualizationData,
    nowMV,
    startTime,
    recording,
    stopTimeMV,
  }: {
    t: number
    visualizationData: Map<number, AudioSegment>
    nowMV: MotionValue<number>
    stopTimeMV: MotionValue<number>
    recording: boolean
    startTime: number
  },
) {
  const height = useMemo(() => {
    return ((visualizationData.get(t)?.volume ?? 0) * 28 / 255) + 4
  }, [t, visualizationData])

  const x = useTransform(() => {
    return -0.032 * (nowMV.get() - t)
  })

  const endX = useTransform(() => {
    return -0.032 * (stopTimeMV.get() - t)
  })

  return (
    <motion.div
      style={{ x: recording ? x : endX, height }}
      transition={{ type: 'tween' }}
      className={clsx(
        'w-0.5 end-0 rounded shrink-0 absolute',
        t <= startTime ? 'bg-[#0A0D332E]' : 'bg-[#0A0D3399]',
      )}
    />
  )
}, (prev, next) => prev.startTime === next.startTime && prev.recording === next.recording)

function useNow(): [number, MotionValue<number>] {
  const [now, setNow] = useState(() => Date.now())
  const nowMV = useMotionValue(now)

  useEffect(() => {
    let raf: number

    const update = () => {
      const now = Date.now()
      setNow(now)
      nowMV.set(now)
      raf = requestAnimationFrame(update)
    }

    raf = requestAnimationFrame(update)

    return () => cancelAnimationFrame(raf)
  }, [])

  return [now, nowMV]
}

async function webmToMp3(blob: Blob): Promise<Blob> {
  const ffmpeg = new FFmpeg()

  const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.9/dist/esm'

  await ffmpeg.load({
    coreURL: await toBlobURL(ffmpegCoreUrl, 'text/javascript'),
    wasmURL: await toBlobURL(ffmpegWasmUrl, 'application/wasm'),
    workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
  })

  await ffmpeg.writeFile('input.webm', await fetchFile(blob))

  await ffmpeg.exec([
    '-i',
    'input.webm',
    '-vn',
    '-c:a',
    'libmp3lame',
    '-b:a',
    '0',
    '-map_metadata',
    '0',
    '-fflags',
    '+genpts',
    'output.mp3',
  ])

  const data = await ffmpeg.readFile('output.mp3')

  return new Blob([data], { type: 'audio/mpeg' })
}
