import './assets/main.css'

import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { QrcodeStream } from 'vue-qrcode-reader'
import App from './App.vue'
import router from './router'
import { clearAllTransfers, isOpfsSupported } from './utils/opfsStorage'

// Clean up stale OPFS transfer files from previous sessions
if (isOpfsSupported()) {
  clearAllTransfers().catch(() => {})
}

const pinia = createPinia()
const app = createApp(App)

app.use(router)
app.component('qrcode-stream', QrcodeStream)
app.use(pinia)
app.mount('#app')
