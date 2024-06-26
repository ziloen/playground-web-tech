import { asNonNullable, asType } from '@wai-ri/core'
import { useMemoizedFn } from 'ahooks'
import { Button, Input, Select } from 'antd'
import type { BaseOptionType, DefaultOptionType } from 'antd/es/select'
import { useNextEffect } from '~/hooks'
import CarbonCloud from '~icons/carbon/cloud'

const defaultText =
  `从零开始学习 Web 开发极具挑战性，该教程将为你提供详细的资料，手把手帮助你轻松愉快地学习。无论你是正在学习 Web 开发的学生（自学或参与课程）、寻找材料的老师、编程爱好者，亦或是仅仅想了解一点点 Web 技术，我们都希望你能感到宾至如归。`

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
  && navigator.userAgentData.brands.some(brand => brand.brand === 'Google Chrome')

export default function WebSpeechAPIPage() {
  const [inputText, setInputText] = useState(defaultText)
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const nextEffect = useNextEffect()
  const [voiceList, setVoiceList] = useState<SpeechSynthesisVoice[] | null>(() => {
    const list = speechSynthesis.getVoices()

    if (list.length) return list

    speechSynthesis.addEventListener('voiceschanged', e => {
      nextEffect(() => setVoiceList(speechSynthesis.getVoices()))
    }, { once: true })

    return null
  })
  const [pitch, setPitch] = useState(1)
  const [lang, setLang] = useState('zh-CN')
  const [volume, setVolume] = useState(1)
  const [rate, setRate] = useState(1)

  const groupByLang = useMemo(() => {
    if (!voiceList) return null
    return Object.groupBy(voiceList, voice => voice.lang)
  }, [voiceList])

  const options = useMemo<VoiceOptionGroup[]>(() => {
    if (!groupByLang) return []

    return Object.entries(groupByLang).map(([lang, voices]) => {
      asNonNullable(voices)

      return {
        label: <span>{lang}</span>,
        title: lang,
        options: voices.map(voice => ({
          value: voice.name,
          label: voice.name,

          voice,
        })),
      }
    })
  }, [groupByLang])

  const pausedRef = useRef(false)
  const startedRef = useRef(false)

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

    utterance.addEventListener('boundary', e => {
      console.log('boundary', e)
    })

    utterance.addEventListener('start', e => {
      console.log('start', e)
      startedRef.current = true
      // pause before start will not work, check paused status when start
      if (isChrome && pausedRef.current) {
        console.log('pause after start')
        speechSynthesis.pause()
      }
    })

    utterance.addEventListener('end', e => {
      console.log('end', e)
      pausedRef.current = false
      startedRef.current = false
    })

    utterance.addEventListener('error', e => {
      console.log('error', e)
      startedRef.current = false
      pausedRef.current = false
    })

    utterance.addEventListener('pause', e => {
      console.log('pause', e)
    })

    utterance.addEventListener('resume', e => {
      console.log('resume', e)
    })

    utterance.addEventListener('mark', e => {
      console.log('mark', e)
    })

    return utterance
  }, [])

  const onSpeek = useMemoizedFn(() => {
    utterance.text = inputText
    utterance.voice = voiceList?.find(voice => voice.name === selectedVoice) ?? null
    utterance.lang = lang
    utterance.pitch = pitch
    utterance.volume = volume
    if (speechSynthesis.speaking) {
      console.log('cancel previous speech')
      speechSynthesis.cancel()
    }

    console.log('before speak', {
      lang,
      voice: utterance.voice,
      pitch,
    })
    speechSynthesis.speak(utterance)
    pausedRef.current = false
    startedRef.current = false
    console.log(
      `after speak`
    )
  })

  return (
    <div>
      <h1>Web Speech API</h1>

      <div>
        <span>voice</span>
        <Select<string, VoiceOptionGroup>
          showSearch
          className="min-w-40"
          virtual={false}
          value={selectedVoice}
          dropdownStyle={{
            maxHeight: '400px',
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
        <div>
          <span>lang</span>
          <Select
            value={lang}
            onChange={setLang}
            options={Object.keys(groupByLang).map(lang => ({
              value: lang,
              label: lang,
            }))}
          />
        </div>
      )}

      <div>
        <span>pitch</span>
        <input
          type="range"
          value={pitch}
          onChange={e => setPitch(Number(e.currentTarget.value))}
          min={0}
          max={2}
          step={0.01}
        />
      </div>

      <div>
        <span>volume</span>
        <input
          type="range"
          value={volume}
          onChange={e => {
            const value = Number(e.currentTarget.value)
            setVolume(value)
            utterance.volume = value

            if (speechSynthesis.speaking) {
              onSpeek()
            }
          }}
          min={0}
          max={1}
          step={0.01}
        />
      </div>

      <div>
        <span>rate</span>
        <input
          type="range"
          value={rate}
          onChange={e => {
            const value = Number(e.currentTarget.value)
            setRate(value)
            utterance.rate = value
          }}
          min={0.1}
          max={10}
          step={0.1}
        />
      </div>

      <div>
        <Input.TextArea
          value={inputText}
          onChange={e => setInputText(e.currentTarget.value)}
        />
      </div>

      <Button
        onClick={onSpeek}
      >
        Speak
      </Button>

      <Button
        onClick={e => {
          console.log('before cancel')
          pausedRef.current = false
          startedRef.current = false
          speechSynthesis.cancel()
          console.log('after cancel')
        }}
      >
        Cancel
      </Button>

      <br />

      <Button
        onClick={e => {
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
      </Button>

      <Button
        onClick={() => {
          console.log('before resume')
          pausedRef.current = false
          speechSynthesis.resume()
          console.log('after resume')
        }}
      >
        Resume
      </Button>
    </div>
  )
}
