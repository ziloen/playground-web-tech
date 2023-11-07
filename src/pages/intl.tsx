import { ArrayType } from '@wai-ri/core'
import { Select } from 'antd'
import { useMotionValue } from 'framer-motion'


const Languages = [
  'en',
  'es',
  'zh-Hans',
  'zh-Hant',
  'fr',
  'ja',
  'ko'
]


export default function IntlPage() {
  const [language, setLanguage] = useState('en')

  return (
    <div className='w-full h-full flex flex-col'>
      {/* Header */}
      <div className='px-20px py-8px bg-white/10 flex-between items-center'>
        <div>Intl</div>
        <LanguageSelect language={language} onChange={setLanguage} />
      </div>

      <div className='flex-1 overflow-y-auto px-20px py-10px'>
        <TimeNow language={language} />
      </div>
    </div>
  )
}


function LanguageSelect({
  language,
  onChange
}: {
  language: string
  onChange: (language: string) => void }
) {
  const options = useMemo(() => {
    return Languages.map(lang => {
      const nativeDisplayName = getLanguageDisplayName(lang, lang)
      const displayName = getLanguageDisplayName(language, lang)

      return {
        label: (
          <div className='flex-between items-center gap-2em'>
            <span>{displayName}</span>
            <span>{nativeDisplayName}</span>
          </div>
        ),
        value: lang,
        nativeDisplayName,
        displayName,
      }
    })
  }, [language])

  return (
    <Select<string, ArrayType<typeof options>>
      defaultValue={language}
      options={options}
      onChange={onChange}
      popupMatchSelectWidth={false}
      placement="bottomRight"
      bordered={false}
      optionLabelProp='nativeDisplayName'
    />
  )
}


function TimeNow({ language }: { language: string }) {
  const formatter = useMemo(() => new Intl.DateTimeFormat(language, {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  }), [language])

  const nowStr = useMotionValue('')

  useEffect(() => {
    let animationFrameId: number

    function updateNow() {
      nowStr.set(formatter.format(new Date()))
      animationFrameId = requestAnimationFrame(updateNow)
    }

    animationFrameId = requestAnimationFrame(updateNow)

    return () => cancelAnimationFrame(animationFrameId)
  }, [formatter])

  return <motion.div>{nowStr}</motion.div>
}


function getLanguageDisplayName(
  displayLanguage: string,
  language: string,
) {
  const displayNames = new Intl.DisplayNames([displayLanguage], { type: 'language' })
  return displayNames.of(language)
}