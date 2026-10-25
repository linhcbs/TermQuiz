import { createRouter, createWebHashHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import QuestionBanksView from '../views/QuestionBanksView.vue'
import BankDetailView from '../views/BankDetailView.vue'
import PracticeView from '../views/PracticeView.vue'
import HistoryView from '../views/HistoryView.vue'
import GuideView from '../views/GuideView.vue'
import SettingsView from '../views/SettingsView.vue'

const router = createRouter({
  // Hash mode — no server config required for local use
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { title: 'Dashboard' },
    },
    {
      path: '/banks',
      name: 'banks',
      component: QuestionBanksView,
      meta: { title: 'Question Banks' },
    },
    {
      path: '/banks/new',
      name: 'banks-new',
      component: BankDetailView,
      meta: { title: 'New Bank' },
    },
    {
      path: '/banks/:id',
      name: 'bank-detail',
      component: BankDetailView,
      meta: { title: 'Bank Detail' },
    },
    {
      path: '/practice/:id',
      name: 'practice',
      component: PracticeView,
      meta: { title: 'Practice' },
    },
    {
      path: '/history',
      name: 'history',
      component: HistoryView,
      meta: { title: 'History' },
    },
    {
      path: '/guide',
      name: 'guide',
      component: GuideView,
      meta: { title: 'AI Prompt & Format Guide' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      meta: { title: 'Settings' },
    },
    // Catch-all redirect
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

// Update document title
router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  document.title = title ? `${title} — TermQuiz` : 'TermQuiz'
})

export default router
