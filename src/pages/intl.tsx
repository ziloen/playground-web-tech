import type { ArrayType } from '@wai-ri/core'
import { Select } from 'antd'
import { useMotionValue } from 'framer-motion'

const Languages = [
  'en',
  'zh-Hans',
  'zh-Hant',
  'hi',
  'es',
  'fr',
  'ar',
  'bn',
  'ru',
  'pt',
  'id',
  'ur',
  'mr',
  'tr',
  'ta',
  'th',
  'vi',
  'it',
  'ko',
  'de',
  'fa',
  'jv',
  'gu',
  'te',
  'kn',
  'pl',
  'or',
  'ms',
  'my',
  'kk',
  'sr',
  'ha',
  'am',
  'uk',
  'ne',
  'nl',
  'yo',
  'pa',
  'si',
  'ny',
  'kmr',
  'sdh',
]

export default function IntlPage() {
  const [language, setLanguage] = useState('en')

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="px-[20px] py-[8px] bg-white/10 flex-between items-center">
        <div>Intl</div>
        <LanguageSelect language={language} onChange={setLanguage} />
      </div>

      <div className="flex-1 overflow-y-auto px-[20px] py-[10px]">
        <TimeNow language={language} />
      </div>
    </div>
  )
}

function LanguageSelect({
  language,
  onChange,
}: {
  language: string
  onChange: (language: string) => void
}) {
  const options = useMemo(() => {
    return Intl.DisplayNames.supportedLocalesOf(Languages, { localeMatcher: 'best fit' }).map(
      lang => {
        const nativeDisplayName = getLanguageDisplayName(lang, lang)
        const displayName = getLanguageDisplayName(language, lang)

        return {
          label: (
            <div className="flex-between items-center gap-2em">
              <span>{displayName}</span>
              <span>{nativeDisplayName}</span>
            </div>
          ),
          value: lang,
          nativeDisplayName,
          displayName,
        }
      },
    )
  }, [language])

  return (
    <Select<string, ArrayType<typeof options>>
      defaultValue={language}
      options={options}
      onChange={onChange}
      popupMatchSelectWidth={false}
      placement="bottomRight"
      variant="borderless"
      optionLabelProp="nativeDisplayName"
    />
  )
}

function TimeNow({ language }: { language: string }) {
  const formatter = useMemo(() =>
    new Intl.DateTimeFormat(language, {
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
  const displayNames = new Intl.DisplayNames([displayLanguage], {
    type: 'language',
    languageDisplay: 'dialect',
  })
  return displayNames.of(language)
}
