import { Markdown } from '~/components/Markdown'

const testText = [
  // test code block
  `\`\`\`javascript
// 测试不同参数的浏览器支持情况  
const supportedTypes = [  
  'audio/webm;codecs=opus', // 显式指定  
  'audio/webm',            // 隐式选择  
  'audio/ogg;codecs=opus'  // 替代方案  
];

supportedTypes.forEach(type => {  
  console.log(\`\${type}: \${MediaRecorder.isTypeSupported(type)}\`);  
});
\`\`\``,
  // test math
  `\\(L_C\\)\n\\[\nL_C\n\\]`,
  // test url with space
  `[test url with space](https://www.google.com/search?q=markdown url with space)`,
  // test url no space
  `[test url no space](https://www.google.com/search?q=markdown+url+without+space)`,
  // test url with parentheses
  `[Some stupid Mixpanel link](https://mixpanel.com/report/380063/insights#~(displayOptions~(chartType~'bar~plotStyle~'standard~analysis~'linear~value~'relative)~sorting~(bar~(sortBy~'column~colSortAttrs~(~(sortBy~'value~sortOrder~'desc)~(sortBy~'value~sortOrder~'desc)))~line~(sortBy~'value~sortOrder~'desc)~table~(sortBy~'column~colSortAttrs~(~(sortBy~'label~sortOrder~'asc)~(sortBy~'label~sortOrder~'asc))))~columnWidths~(bar~())~title~'~sections~(show~(~(dataset~'!mixpanel~value~(name~'Board*20Viewed)~resourceType~'events~profileType~null~search~'~math~'total~property~null))~group~(~(dataset~'!mixpanel~value~'!browser~resourceType~'events~profileType~null~search~'~propertyType~'string~typeCast~null~unit~null))~filter~(clauses~(~(dataset~'!mixpanel~value~'Application~resourceType~'events~profileType~null~search~'~filterType~'string~defaultType~'string~filterOperator~'equals~filterValue~(~'webapp)))~determiner~'all)~time~(~(dateRangeType~'in*20the*20last~unit~'day~window~(value~30~unit~'day))))))`,
  '<think>\n好的，用户问“你好吗”，我需要用中文回应。根据指南，回答要简洁自然，符合对话风格。首先，我应该礼貌回应，然后提供进一步帮助。还要注意避免重复和生硬用语。可以回答：“你好！我是一个AI助手，没有情绪感受，但随时准备好为你提供帮助。今天有什么需要我为你处理的吗？” 这样既友好又符合要求，同时保持口语化。检查是否符合所有指南，确保没有使用复杂结构或冗长句子。确认无误后，发送回复。\n</think>',
  '    test ~~indented code~~ *abc* `are you ok` [some link](https://example.com)',
  'https://test/auto/link1234   www.abc.com/abc  abc@abc.abc',

  // FIXME: `**"` 和 `"**` 被视为整体导致没有加粗
  '**"色即是空，空即是色"**的佛学思想贯穿全书。',
].join('\n\n')

export default function MarkdownPage() {
  return (
    <div className="px-4" dir="auto">
      <Markdown>{testText}</Markdown>
    </div>
  )
}
