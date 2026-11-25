import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// `npm run dev:https` serves over self-signed HTTPS so the camera works when
// testing from an iPad/phone on the local network.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'https' ? [basicSsl()] : [])],
}))
