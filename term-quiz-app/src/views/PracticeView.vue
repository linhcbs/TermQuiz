<script setup lang="ts">
// PracticeView — Orchestrates quiz session lifecycle
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import type { QuizSession } from '../types'
import { getBank } from '../services/bankStorage'
import { recordSession } from '../services/sessionHistory'
import { useTerminalLog } from '../services/terminalLog'
import QuizWorkspace from '../components/QuizWorkspace.vue'
import QuizSummary from '../components/QuizSummary.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const { info, warn, ok, error: logError } = useTerminalLog()

// ─── State ────────────────────────────────────────────────────

const bank = ref<ReturnType<typeof getBank>>(null)
const phase = ref<'loading' | 'quiz' | 'summary' | 'error'>('loading')
const completedSession = ref<QuizSession | null>(null)
const errorMsg = ref('')

// Navigation guard state
const showExitDialog = ref(false)
let pendingNavigationResolve: ((v: boolean) => void) | null = null

function onBeforeUnload(e: BeforeUnloadEvent) {
  if (phase.value === 'quiz') {
    e.preventDefault()
    e.returnValue = ''
  }
}

// ─── Lifecycle ────────────────────────────────────────────────

onMounted(() => {
  window.addEventListener('beforeunload', onBeforeUnload)
  const id = route.params.id as string
  const b = getBank(id)
  if (!b) {
    errorMsg.value = `Question bank "${id}" not found.`
    phase.value = 'error'
    logError(`Practice: bank "${id}" not found.`)
    return
  }
  if (b.questions.length === 0) {
    errorMsg.value = `Bank "${b.title}" has no questions. Add questions before practicing.`
    phase.value = 'error'
    warn(`Bank "${b.title}" is empty.`)
    return
  }

  bank.value = b
  phase.value = 'quiz'
  info(`Practice session: ${b.title}`)
})

// Warn before navigating away from active quiz
onBeforeRouteLeave(async (_to, _from) => {
  if (phase.value !== 'quiz') return true

  return new Promise<boolean>((resolve) => {
    showExitDialog.value = true
    pendingNavigationResolve = resolve
  })
})

function handleExitConfirm() {
  showExitDialog.value = false
  if (pendingNavigationResolve) {
    pendingNavigationResolve(true)
    pendingNavigationResolve = null
  }
  warn('Practice session cancelled.')
}

function handleExitCancel() {
  showExitDialog.value = false
  if (pendingNavigationResolve) {
    pendingNavigationResolve(false)
    pendingNavigationResolve = null
  }
}

// ─── Session handlers ─────────────────────────────────────────

function onComplete(session: QuizSession) {
  completedSession.value = session
  recordSession(session)
  phase.value = 'summary'
}

function onExit() {
  // This triggers the navigation guard above
  router.push('/banks')
}

function onRestart() {
  phase.value = 'quiz'
  completedSession.value = null
  ok('Starting new session...')
}

function onBackToBanks() {
  phase.value = 'summary' // ensure guard allows navigation
  router.push('/banks')
}

onUnmounted(() => {
  window.removeEventListener('beforeunload', onBeforeUnload)
})
</script>

<template>
  <div class="practice-view">

    <!-- Loading / Error -->
    <div v-if="phase === 'error'" class="error-state">
      <span class="text-red" aria-hidden="true">✗</span>
      <div class="error-content">
        <p class="text-red">{{ errorMsg }}</p>
        <button id="btn-back-from-error" class="btn btn-secondary" @click="router.push('/banks')">← back to banks</button>
      </div>
    </div>

    <!-- Active quiz -->
    <QuizWorkspace
      v-else-if="phase === 'quiz' && bank"
      :bank="bank"
      @complete="onComplete"
      @exit="onExit"
    />

    <!-- Session summary -->
    <div v-else-if="phase === 'summary' && completedSession" class="summary-wrap">
      <QuizSummary
        :session="completedSession"
        @restart="onRestart"
        @back-to-banks="onBackToBanks"
      />
    </div>

    <!-- Exit confirm -->
    <ConfirmDialog
      v-if="showExitDialog"
      title="Exit Session"
      message="Are you sure you want to exit? Your progress in this session will be lost."
      confirm-label="Exit"
      :danger="true"
      @confirm="handleExitConfirm"
      @cancel="handleExitCancel"
    />
  </div>
</template>

<style scoped>
.practice-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.error-state {
  padding: var(--space-8);
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  font-size: 14px;
}
.error-content { display: flex; flex-direction: column; gap: var(--space-4); }

.summary-wrap {
  flex: 1;
  overflow-y: auto;
}

.btn {
  font-family: var(--font-mono);
  font-size: 13px;
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-normal);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-weight: 500;
}
.btn-secondary {
  background: transparent;
  color: var(--color-muted);
}
.btn-secondary:hover { color: var(--color-text); border-color: var(--border-bright); }
</style>
