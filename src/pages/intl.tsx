import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
} from '~/components/Select'
import { useMemoizedFn } from '~/hooks'
import { formatLanguageName } from '~/utils/intl'

const Languages = [
  'en',
  'zh-Hans',
  'es',
  'ar',
  'pt',
  'id',
  'fr',
  'ja',
  'ru',
  'de',
  'fil',
  'tr',
  'it',
  'ko',
  'vi',
  'th',
  'fa',
  'pl',
  'nl',
  'hi',
  'ur',
  'ro',
  'uk',
  'bn',
  'ta',
  'mr',
  'te',
  'ms',
  'zh-Hant',
  'sv',
  'cs',
  'el',
  'hu',
  'he',
  'gu',
  'kn',
  'pa',
  'sr',
  'jv',
  'my',
  'kk',
  'ha',
  'am',
  'ne',
  'yo',
  'si',
  'sw',
  'or',
  'kmr',
  'ny',
  'sdh',
]

export default function IntlPage() {
  const [language, setLanguage] = useState('en')

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between bg-white/10 px-[20px] py-[8px]">
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
  const [isOpen, setIsOpen] = useState(false)

  const options = useMemo(() => {
    return Intl.DisplayNames.supportedLocalesOf(Languages, {
      localeMatcher: 'best fit',
    }).map((lang) => {
      const nativeDisplayName = formatLanguageName(lang, { language: lang })
      const displayName = formatLanguageName(lang, { language })

      return {
        value: lang,
        nativeDisplayName,
        displayName,
      }
    })
  }, [language])

  const items = useMemo(() => {
    return options.map((option) => (
      <SelectItem
        value={option.value}
        key={option.value}
        className="flex min-w-max items-center justify-between gap-[2em]"
      >
        <SelectItemText>{option.displayName}</SelectItemText>
        <span>{option.nativeDisplayName}</span>
      </SelectItem>
    ))
  }, [options])

  // 关闭时，使用选择前的渲染缓存，防止 items 导致内容闪烁
  const [cachedItems, setCachedItems] = useState<React.JSX.Element[] | null>(null)

  const selectedOption = options.find((option) => option.value === language)

  const onOpenChange = useMemoizedFn((open: boolean) => {
    setIsOpen(open)
    if (open) {
      setCachedItems(null)
    } else {
      setCachedItems(items)
    }
  })

  return (
    <Select
      value={language}
      onValueChange={(v) => v && onChange(v)}
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <SelectTrigger>
        <span>{selectedOption?.nativeDisplayName}</span>
      </SelectTrigger>

      <SelectContent
        className="max-h-[300px] w-fit scrollbar-thin scrollbar-gutter-stable"
        align="end"
      >
        {cachedItems ?? items}
      </SelectContent>
    </Select>
  )
}

function TimeNow({ language }: { language: string }) {
  const formatter = useMemo(
    () =>
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
      }),
    [language],
  )

  const nowStr = useMotionValue('')
  const [dateTime, setDateTime] = useState('')

  useEffect(() => {
    let animationFrameId: number

    function updateNow() {
      const now = new Date()
      setDateTime(now.toISOString())
      nowStr.set(formatter.format(new Date()))
      animationFrameId = requestAnimationFrame(updateNow)
    }

    animationFrameId = requestAnimationFrame(updateNow)

    return () => cancelAnimationFrame(animationFrameId)
  }, [formatter])

  return <motion.time dateTime={dateTime}>{nowStr}</motion.time>
}
