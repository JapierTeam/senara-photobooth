import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import DownloadPage from './components/DownloadPage'
import './styles.css'

const isDownload = location.pathname.startsWith('/p/')

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isDownload ? <DownloadPage /> : <App />}</StrictMode>,
)
