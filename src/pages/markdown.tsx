import { Markdown } from '~/components/Markdown'

const testCodeBlock = `\`\`\`javascript
// 测试不同参数的浏览器支持情况  
const supportedTypes = [  
  'audio/webm;codecs=opus', // 显式指定  
  'audio/webm',            // 隐式选择  
  'audio/ogg;codecs=opus'  // 替代方案  
];

supportedTypes.forEach(type => {  
  console.log(\`\${type}: \${MediaRecorder.isTypeSupported(type)}\`);  
});
\`\`\``

const testMath = `\\(L_C\\)\n\\[\nL_C\n\\]`

export default function MarkdownPage() {
  return (
    <div>
      <Markdown>{testCodeBlock}</Markdown>
      <Markdown>{testMath}</Markdown>
    </div>
  )
}
