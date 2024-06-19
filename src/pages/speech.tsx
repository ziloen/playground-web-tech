import { asNonNullable, asType } from '@wai-ri/core'
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

  useEffect(() => {
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)

    let timer: ReturnType<typeof setTimeout> | undefined
    if (isChrome) {
      timer = setInterval(() => {
        console.log('Chrome bug fix', speechStatus())
        if (speechSynthesis.speaking && !speechSynthesis.paused) {
          speechSynthesis.pause()
          speechSynthesis.resume()
        }
      }, 12_000)
    }

    return () => {
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
    })

    utterance.addEventListener('end', e => {
      console.log('end', e)
    })

    utterance.addEventListener('error', e => {
      console.log('error', e)
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

  return (
    <div>
      <h1>Web Speech API</h1>

      <Select<string, VoiceOptionGroup>
        showSearch
        className="min-w-40"
        virtual
        value={selectedVoice}
        onChange={setSelectedVoice}
        popupMatchSelectWidth={false}
        optionRender={({ data }) => {
          asType<VoiceOption>(data)
          return (
            <div className="flex items-center gap-2">
              <span>{data.voice.name}</span>
              {!data.voice.localService && (
                <CarbonCloud className="text-lg shrink-0 text-blue-600" />
              )}
            </div>
          )
        }}
        options={options}
      />

      <Select />

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
        <Input.TextArea
          value={inputText}
          onChange={e => setInputText(e.currentTarget.value)}
        />
      </div>

      <Button
        onClick={() => {
          utterance.text = inputText
          // const utterance = new SpeechSynthesisUtterance(inputText)
          utterance.voice = voiceList?.find(voice => voice.name === selectedVoice) ?? null
          utterance.lang = 'zh-CN'
          utterance.pitch = pitch
          if (speechSynthesis.speaking) {
            speechSynthesis.cancel()
          }

          console.log('before speak', speechStatus())
          speechSynthesis.speak(utterance)
          console.log(
            `after speak`,
            speechStatus()
          )
        }}
      >
        Speak
      </Button>

      <Button
        onClick={e => {
          console.log('before cancel', speechStatus())
          speechSynthesis.cancel()
          console.log('after cancel', speechStatus())
        }}
      >
        Cancel
      </Button>

      <Button
        onClick={e => {
          console.log('before pause', speechStatus())
          speechSynthesis.pause()
          console.log('after pause', speechStatus())
        }}
      >
        Pause
      </Button>

      <Button
        onClick={() => {
          console.log('before resume', speechStatus())
          speechSynthesis.resume()
          console.log('after resume', speechStatus())
        }}
      >
        Resume
      </Button>
    </div>
  )
}

function speechStatus() {
  return {
    pending: speechSynthesis.pending,
    speaking: speechSynthesis.speaking,
    paused: speechSynthesis.paused,
  }
}
