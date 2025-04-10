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
  '    test indented code *abc* `are you ok`',
].join('\n\n')

export default function MarkdownPage() {
  return (
    <div className="px-4">
      <Markdown>{testText}</Markdown>
    </div>
  )
}
