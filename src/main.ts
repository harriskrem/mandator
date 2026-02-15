import './assets/main.css'

import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { QrcodeStream } from 'vue-qrcode-reader'
import App from './App.vue'
import router from './router'

const pinia = createPinia()
const app = createApp(App)

app.use(router)
app.component('qrcode-stream', QrcodeStream)
app.use(pinia)
app.mount('#app')
