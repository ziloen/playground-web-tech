export default function WebSpeechAPIPage() {
  const [inputText, setInputText] = useState('')

  return (
    <div>
      <h1>Web Speech API</h1>
      <div>
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
        />
      </div>
    </div>
  )
}
