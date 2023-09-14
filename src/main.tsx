import { createRoot } from 'react-dom/client'
import App from './App'

import '@unocss/reset/tailwind.css'
import { HashRouter } from 'react-router-dom'
import 'uno.css'
import './styles/main.css'

createRoot(document.querySelector('#root')!).render(
  <HashRouter>
    <App />
  </HashRouter>
)
