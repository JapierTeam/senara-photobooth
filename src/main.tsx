import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import DownloadPage from './components/DownloadPage'
import { I18nProvider } from './lib/i18n'
import './styles.css'

const isDownload = location.pathname.startsWith('/p/')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>{isDownload ? <DownloadPage /> : <App />}</I18nProvider>
  </StrictMode>,
)
