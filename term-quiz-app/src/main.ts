import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { initializeDefaultBanks } from './services/bankStorage'

// Auto-import sample question banks on first visit (e.g. GitHub Pages trial)
initializeDefaultBanks()

const app = createApp(App)
app.use(router)
app.mount('#app')
