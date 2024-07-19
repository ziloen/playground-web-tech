import { asNonNullable, asType } from '@wai-ri/core'
import { useMemoizedFn } from 'ahooks'
import { Button, Form, Input, Select, Slider } from 'antd'
import type { DefaultOptionType } from 'antd/es/select'
import { useGetState, useNextEffect } from '~/hooks'
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
  && navigator.userAgentData.brands.some(brand => brand.brand === 'Google Chrome')

export default function WebSpeechAPIPage() {
  const [inputText, setInputText, getInputText] = useGetState(defaultZhText)
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
  const [pitch, setPitch, getPitch] = useGetState(1)
  const [lang, setLang, getLang] = useGetState('zh-CN')
  const [volume, setVolume, getVolume] = useGetState(1)
  const [rate, setRate, getRate] = useGetState(1)

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

    utterance.addEventListener('boundary', e => {
      console.log('boundary')
    })

    utterance.addEventListener('start', e => {
      console.log('%c▶', 'color: #28e172;', 'start')

      startedRef.current = true
      // pause before start will not work, check paused status when start
      if (isChrome && pausedRef.current) {
        console.log('pause after start')
        speechSynthesis.pause()
      }
    })

    utterance.addEventListener('end', e => {
      console.log('end')
      pausedRef.current = false
      startedRef.current = false
    })

    utterance.addEventListener('error', e => {
      console.log('❌', 'error', e.error)
      startedRef.current = false
      pausedRef.current = false
    })

    utterance.addEventListener('pause', e => {
      console.log('pause')
    })

    utterance.addEventListener('resume', e => {
      console.log('resume')
    })

    utterance.addEventListener('mark', e => {
      console.log('mark')
    })

    return utterance
  }, [])

  const onSpeek = useMemoizedFn(() => {
    speak()
  })

  const speak = useMemoizedFn(() => {
    const voice = voiceList?.find(voice => voice.name === selectedVoice) ?? null
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

  return (
    <div>
      <h1>Web Speech API</h1>

      <Form>
        <Form.Item label="voice">
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
        </Form.Item>

        {groupByLang && (
          <Form.Item label="lang">
            <Select
              value={lang}
              onChange={lang => {
                setLang(lang)
                if (lang === 'en-US') {
                  setInputText(defaultEnText)
                }
              }}
              options={Object.keys(groupByLang).map(lang => ({
                value: lang,
                label: lang,
              }))}
            />
          </Form.Item>
        )}

        <Form.Item label="pitch">
          <Slider
            value={pitch}
            onChange={e => {
              setPitch(e)

              if (speechSynthesis.speaking) {
                onSpeek()
              }
            }}
            min={0}
            max={2}
            step={0.01}
          />
        </Form.Item>

        <Form.Item label="volume">
          <Slider
            value={volume}
            onChange={e => {
              setVolume(e)

              if (speechSynthesis.speaking) {
                onSpeek()
              }
            }}
            min={0}
            max={1}
            step={0.01}
          />
        </Form.Item>

        <Form.Item label="rate">
          <Slider
            value={rate}
            onChange={e => {
              setRate(e)

              if (speechSynthesis.speaking) {
                onSpeek()
              }
            }}
            min={0.1}
            max={10}
            step={0.1}
          />
        </Form.Item>
      </Form>

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
          pausedRef.current = false
          startedRef.current = true
          speechSynthesis.cancel()
          console.log('🟡', 'cancel')
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

      <div className="grid">
        <div className="grid-cols-subgrid">
        </div>
      </div>

      <table
        style={{ borderCollapse: 'collapse' }}
      >
        <thead style={{ padding: '10px' }}>
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
    </div>
  )
}
