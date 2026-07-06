/* eslint-disable unicorn/prefer-string-raw */
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { Markdown } from './Markdown'

function TestWrapper({ children, testId }: { children: React.ReactNode; testId: string }) {
  return (
    <div data-testid={testId} style={{ width: 'fit-content' }}>
      {children}
    </div>
  )
}

describe('Markdown', () => {
  it('should render code block', async () => {
    const codeBlock = `\`\`\`javascript
// 测试不同参数的浏览器支持情况
const supportedTypes = [
  'audio/webm;codecs=opus', // 显式指定
  'audio/webm',            // 隐式选择
  'audio/ogg;codecs=opus'  // 替代方案
];

supportedTypes.forEach((type) => {
  console.log(\`\${type}: \${MediaRecorder.isTypeSupported(type)}\`);
});
\`\`\``

    await render(
      <TestWrapper testId="markdown-code">
        <Markdown>{codeBlock}</Markdown>
      </TestWrapper>,
    )
    await expect.element(page.getByTestId('markdown-code')).toMatchScreenshot('markdown-code-block')
  })

  it('support `\\(\\)` and `\\[\\]` as math syntax', async () => {
    const mathBlock = `\\(L_C\\)\n\\[\nL_C\n\\]`

    await render(
      <TestWrapper testId="markdown-math">
        <Markdown>{mathBlock}</Markdown>
      </TestWrapper>,
    )
    await expect.element(page.getByTestId('markdown-math')).toMatchScreenshot('markdown-math')
  })

  it('should handle `\\[\\]` on same line without crash', async () => {
    // Trailing text after \] on same line is consumed by the fence
    // (micromark flow construct constraint). Key: no crash, no .katex-error.
    const sameLineMath = `\\[\\] text consumed by fence`

    await render(
      <TestWrapper testId="markdown-math-sameline">
        <Markdown>{sameLineMath}</Markdown>
      </TestWrapper>,
    )

    // Verify no KaTeX error — the element renders without crash
    const text = page.getByTestId('markdown-math-sameline').element().textContent
    expect(text).not.toContain('katex-error')
  })

  it('should not crash on unclosed `\\[` (EOF safety)', async () => {
    const unclosedMath = `\\[\nE = mc^2`

    await render(
      <TestWrapper testId="markdown-math-unclosed">
        <Markdown>{unclosedMath}</Markdown>
      </TestWrapper>,
    )
    // Should not throw — the parser handles EOF gracefully inside math blocks
    await expect
      .element(page.getByTestId('markdown-math-unclosed'))
      .toMatchScreenshot('markdown-math-unclosed')
  })

  it('should render complex LaTeX math block', async () => {
    const complexMath = `\\[\n\\begin{aligned}\nE &= \\frac{1}{2}mv^2 \\\\\nm &= \\rho \\cdot \\frac{4}{3}\\pi r^3\n\\end{aligned}\n\\]`

    await render(
      <TestWrapper testId="markdown-math-complex">
        <Markdown>{complexMath}</Markdown>
      </TestWrapper>,
    )
    await expect
      .element(page.getByTestId('markdown-math-complex'))
      .toMatchScreenshot('markdown-math-complex')
  })

  it('should render single-line `\\[ ... \\]` display math', async () => {
    const singleLineMath = `\\[ E = mc^2 \\]`

    await render(
      <TestWrapper testId="markdown-math-singleline">
        <Markdown>{singleLineMath}</Markdown>
      </TestWrapper>,
    )
    await expect
      .element(page.getByTestId('markdown-math-singleline'))
      .toMatchScreenshot('markdown-math-singleline')
  })

  it('should render `\\(\\)` inline math with trailing text on same line', async () => {
    const inlineMath = `\\(x^2\\) and more text`

    await render(
      <TestWrapper testId="markdown-math-inline">
        <Markdown>{inlineMath}</Markdown>
      </TestWrapper>,
    )
    await expect
      .element(page.getByTestId('markdown-math-inline'))
      .toMatchScreenshot('markdown-math-inline')
  })

  it('should render link with spaces in URL', async () => {
    const urlWithSpace = `[test url with space](https://www.google.com/search?q=markdown url with space)`

    await render(
      <TestWrapper testId="markdown-url-space">
        <Markdown>{urlWithSpace}</Markdown>
      </TestWrapper>,
    )
    await expect
      .element(page.getByTestId('markdown-url-space'))
      .toMatchScreenshot('markdown-url-space')
  })

  it('should render link without spaces in URL', async () => {
    const urlNoSpace = `[test url no space](https://www.google.com/search?q=markdown+url+without+space)`

    await render(
      <TestWrapper testId="markdown-url-nospace">
        <Markdown>{urlNoSpace}</Markdown>
      </TestWrapper>,
    )
    await expect
      .element(page.getByTestId('markdown-url-nospace'))
      .toMatchScreenshot('markdown-url-nospace')
  })

  it('should render link with parentheses in URL', async () => {
    const urlWithParentheses = `[Some stupid Mixpanel link](https://mixpanel.com/report/380063/insights#~(displayOptions~(chartType~'bar~plotStyle~'standard~analysis~'linear~value~'relative)~sorting~(bar~(sortBy~'column~colSortAttrs~(~(sortBy~'value~sortOrder~'desc)~(sortBy~'value~sortOrder~'desc)))~line~(sortBy~'value~sortOrder~'desc)~table~(sortBy~'column~colSortAttrs~(~(sortBy~'label~sortOrder~'asc)~(sortBy~'label~sortOrder~'asc))))~columnWidths~(bar~())~title~'~sections~(show~(~(dataset~'!mixpanel~value~(name~'Board*20Viewed)~resourceType~'events~profileType~null~search~'~math~'total~property~null))~group~(~(dataset~'!mixpanel~value~'!browser~resourceType~'events~profileType~null~search~'~propertyType~'string~typeCast~null~unit~null))~filter~(clauses~(~(dataset~'!mixpanel~value~'Application~resourceType~'events~profileType~null~search~'~filterType~'string~defaultType~'string~filterOperator~'equals~filterValue~(~'webapp)))~determiner~'all)~time~(~(dateRangeType~'in*20the*20last~unit~'day~window~(value~30~unit~'day))))))`

    await render(
      <TestWrapper testId="markdown-url-parens">
        <Markdown>{urlWithParentheses}</Markdown>
      </TestWrapper>,
    )
    await expect
      .element(page.getByTestId('markdown-url-parens'))
      .toMatchScreenshot('markdown-url-parens')
  })

  it('should render think block', async () => {
    const thinkBlock =
      '<think>\n好的，用户问"你好吗"，我需要用中文回应。根据指南，回答要简洁自然，符合对话风格。首先，我应该礼貌回应，然后提供进一步帮助。还要注意避免重复和生硬用语。可以回答："你好！我是一个AI助手，没有情绪感受，但随时准备好为你提供帮助。今天有什么需要我为你处理的吗？" 这样既友好又符合要求，同时保持口语化。检查是否符合所有指南，确保没有使用复杂结构或冗长句子。确认无误后，发送回复。\n</think>'

    await render(
      <TestWrapper testId="markdown-think">
        <Markdown>{thinkBlock}</Markdown>
      </TestWrapper>,
    )
    await expect.element(page.getByTestId('markdown-think')).toMatchScreenshot('markdown-think')
  })

  it('should disable indented code', async () => {
    const indentedText =
      '    test ~~indented code~~ *abc* `are you ok` [some link](https://example.com)'

    await render(
      <TestWrapper testId="markdown-indented">
        <Markdown>{indentedText}</Markdown>
      </TestWrapper>,
    )
    await expect
      .element(page.getByTestId('markdown-indented'))
      .toMatchScreenshot('markdown-indented')
  })

  it('should not render autolinks', async () => {
    const autoLinks = 'https://test/auto/link1234   www.abc.com/abc  abc@abc.abc'

    await render(
      <TestWrapper testId="markdown-autolinks">
        <Markdown>{autoLinks}</Markdown>
      </TestWrapper>,
    )
    await expect
      .element(page.getByTestId('markdown-autolinks'))
      .toMatchScreenshot('markdown-autolinks')
  })

  it('should render bold followed by Chinese characters (straight quotes)', async () => {
    const boldChineseQuote =
      '**"任意字符"**中文字符\n\n**"任意字符"**中文字符\n\n**混合键合（Hybrid Bonding）**设备'

    await render(
      <TestWrapper testId="markdown-bold-cn-quote">
        <Markdown>{boldChineseQuote}</Markdown>
      </TestWrapper>,
    )
    await expect
      .element(page.getByTestId('markdown-bold-cn-quote'))
      .toMatchScreenshot('markdown-bold-cn-quote')
  })

  it('should render table', async () => {
    const table = `| 左对齐 | 居中对齐 | 右对齐 |
|:-------|:--------:|-------:|
| 内容   |   内容   |   内容 |
| 123    |   456    |    789 |`

    await render(
      <TestWrapper testId="markdown-table">
        <Markdown>{table}</Markdown>
      </TestWrapper>,
    )
    await expect.element(page.getByTestId('markdown-table')).toMatchScreenshot('markdown-table')
  })

  it('should render blockquote with inline math', async () => {
    const blockquoteMath = `$0.\\dot{9}$ 等于 $1$，不是数学计算问题，而是"名字"问题。`

    await render(
      <TestWrapper testId="markdown-blockquote-math">
        <Markdown>{blockquoteMath}</Markdown>
      </TestWrapper>,
    )
    await expect
      .element(page.getByTestId('markdown-blockquote-math'))
      .toMatchScreenshot('markdown-blockquote-math')
  })
})
