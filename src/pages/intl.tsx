import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
} from '~/components/Select'
import { useMemoizedFn } from '~/hooks'

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
      <div className="px-[20px] py-[8px] bg-white/10 flex justify-between items-center">
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
    return Intl.DisplayNames.supportedLocalesOf(Languages, { localeMatcher: 'best fit' }).map(
      (lang) => {
        const nativeDisplayName = getLanguageDisplayName(lang, lang)
        const displayName = getLanguageDisplayName(language, lang)

        return {
          value: lang,
          nativeDisplayName,
          displayName,
        }
      },
    )
  }, [language])

  const items = useMemo(() => {
    return options.map((option) => (
      <SelectItem
        value={option.value}
        key={option.value}
        className="flex justify-between items-center gap-[2em] min-w-max"
      >
        <SelectItemText>
          {option.displayName}
        </SelectItemText>
        <span>{option.nativeDisplayName}</span>
      </SelectItem>
    ))
  }, [options])

  // 关闭时，使用选择前的渲染缓存，防止 items 导致内容闪烁
  const [cachedItems, setCachedItems] = useState<React.JSX.Element[] | null>(null)

  const selectedOption = options.find((option) => option.value === language)

  const onOpenChange = useMemoizedFn(
    (open: boolean) => {
      setIsOpen(open)
      if (open) {
        setCachedItems(null)
      } else {
        setCachedItems(items)
      }
    },
  )

  return (
    <Select
      value={language}
      onValueChange={onChange}
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <SelectTrigger>
        <span>{selectedOption?.nativeDisplayName}</span>
      </SelectTrigger>

      <SelectContent className="max-h-[300px] w-fit scrollbar-thin scrollbar-gutter-stable">
        {cachedItems ?? items}
      </SelectContent>
    </Select>
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
  try {
    const displayNames = new Intl.DisplayNames([displayLanguage], {
      type: 'language',
      languageDisplay: 'dialect',
    })
    return displayNames.of(language)
  } catch {
    return language
  }
}
