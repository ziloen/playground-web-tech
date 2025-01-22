import '@ant-design/v5-patch-for-react-19'

import './styles/main.css'

import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.querySelector('#root')!).render(<App />)
