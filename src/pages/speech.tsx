import { Button, Input } from 'antd'

export default function WebSpeechAPIPage() {
  const [inputText, setInputText] = useState('')

  return (
    <div>
      <h1>Web Speech API</h1>
      <div>
        <Input
          value={inputText}
          onChange={e => setInputText(e.currentTarget.value)}
        />
      </div>

      <Button
        onClick={() => {
          const utterance = new SpeechSynthesisUtterance(inputText)
          window.speechSynthesis.speak(utterance)
        }}
      >
        Speak
      </Button>
    </div>
  )
}
