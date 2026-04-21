import { compare, selectorSpecificity, type Specificity } from '@csstools/selector-specificity'
import parser from 'postcss-selector-parser'

type SpecificityResult = {
  selector: string
  specificity?: Specificity
  error?: string
}

// TODO:
// css cascade/specificity challenge
// origin/cascade/specificity/inline/important/shadowdom/pseudo-class/pseudo-element/inheritance/animation/:is()/:where()/:has()/:not()
// What styles will be applied to the element? Why? (multiple choice)

// 类似的，css z-index challenge: Who is on top

export default function CSSSelectorSpecificityPage() {
  const [selector1, setSelector1] = useState('#app main .card:is(.active, .focus)')
  const [selector2, setSelector2] = useState('main .card.active')

  const result1 = useMemo(() => calculateSpecificity(selector1), [selector1])
  const result2 = useMemo(() => calculateSpecificity(selector2), [selector2])

  const comparisonText = useMemo(() => {
    if (!selector2.trim()) return null
    if (!result1.specificity || !result2.specificity) return null

    const compared = compare(result1.specificity, result2.specificity)
    if (compared > 0) return '选择器 1 的 specificity 更高'
    if (compared < 0) return '选择器 2 的 specificity 更高'
    return '两个选择器的 specificity 相同'
  }, [result1.specificity, result2.specificity, selector2])

  return (
    <div className="grid max-w-[900px] gap-4 p-4">
      <h1 className="text-xl font-semibold">CSS Selector Specificity</h1>

      <p className="text-sm opacity-80">
        输入 1~2 个 CSS 选择器，显示各自的 specificity（a,b,c）。
      </p>

      <div className="grid gap-2">
        <label htmlFor="selector-1" className="text-sm">
          选择器 1
        </label>
        <textarea
          id="selector-1"
          className="min-h-[72px] w-full rounded-md border border-solid border-dark-gray-200 bg-dark-gray-800 p-2 font-mono outline-2 outline-offset-2 outline-blue-500 outline-none focus-visible:outline-solid"
          spellCheck="false"
          value={selector1}
          onChange={(event) => setSelector1(event.currentTarget.value)}
        />
        <SpecificityView result={result1} />
      </div>

      <div className="grid gap-2">
        <label htmlFor="selector-2" className="text-sm">
          选择器 2（可选）
        </label>
        <textarea
          id="selector-2"
          className="min-h-[72px] w-full rounded-md border border-solid border-dark-gray-200 bg-dark-gray-800 p-2 font-mono outline-2 outline-offset-2 outline-blue-500 outline-none focus-visible:outline-solid"
          spellCheck="false"
          placeholder="留空表示仅计算第一个选择器"
          value={selector2}
          onChange={(event) => setSelector2(event.currentTarget.value)}
        />
        {selector2.trim() && <SpecificityView result={result2} />}
      </div>

      {comparisonText && (
        <div className="rounded-md border border-solid border-dark-gray-200 px-3 py-2 text-sm">
          {comparisonText}
        </div>
      )}
    </div>
  )
}

function SpecificityView({ result }: { result: SpecificityResult }) {
  if (!result.selector.trim()) {
    return <div className="text-sm opacity-80">请输入选择器</div>
  }

  if (result.error) {
    return <div className="text-sm text-red-400">{result.error}</div>
  }

  if (!result.specificity) {
    return null
  }

  const { a, b, c } = result.specificity

  return (
    <div className="rounded-md border border-solid border-dark-gray-200 px-3 py-2 text-sm">
      specificity: ({a}, {b}, {c})
    </div>
  )
}

function calculateSpecificity(selector: string): SpecificityResult {
  const trimmed = selector.trim()

  if (!trimmed) {
    return { selector }
  }

  try {
    const root = parser().astSync(trimmed)
    if (root.nodes.length !== 1) {
      return {
        selector,
        error: '请只输入一个选择器（不要使用逗号分隔的选择器列表）',
      }
    }

    const specificity = selectorSpecificity(root.nodes[0])
    return {
      selector,
      specificity,
    }
  } catch (error) {
    return {
      selector,
      error: error instanceof Error ? error.message : '选择器解析失败',
    }
  }
}
