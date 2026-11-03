import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import b24UiPlugin from '@bitrix24/b24ui-nuxt/vue-plugin'
import App from './App.vue'
import './assets/main.css'

const router = createRouter({ routes: [], history: createWebHistory() })

createApp(App).use(router).use(b24UiPlugin).mount('#app')
