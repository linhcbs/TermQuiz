<script setup lang="ts">
// HistoryView — Practice session history
import { ref, onMounted } from 'vue'
import { getHistory, clearHistory } from '../services/sessionHistory'
import { useTerminalLog } from '../services/terminalLog'
import { formatTimestamp, formatDuration } from '../utils/helpers'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const { info } = useTerminalLog()

const history = ref(getHistory())
const showClearConfirm = ref(false)

onMounted(() => {
  history.value = getHistory()
  info(`History: ${history.value.length} session(s).`)
})

function confirmClear() {
  clearHistory()
  history.value = []
  showClearConfirm.value = false
}

function accuracyClass(pct: number): string {
  if (pct >= 80) return 'text-green'
  if (pct >= 50) return 'text-yellow'
  return 'text-red'
}
</script>

<template>
  <div class="history-view">

    <div class="history-header">
      <h1 class="view-title">
        <span class="text-cyan">$</span> practice-history
      </h1>
      <div class="header-actions">
        <span class="text-dim">{{ history.length }} session(s)</span>
        <button
          v-if="history.length > 0"
          id="btn-clear-history"
          class="btn-cli btn-cli-danger"
          @click="showClearConfirm = true"
        >
          [x clear all]
        </button>
      </div>
    </div>

    <div class="ascii-rule text-dim">------------------------------------------------------------</div>

    <div v-if="history.length === 0" class="empty-state">
      <span class="text-dim">// no sessions yet</span>
      <p class="text-dim">Complete a quiz session to see it here.</p>
    </div>

    <div v-else class="history-list" role="list" aria-label="Practice session history">

      <!-- Table header -->
      <div class="row-head text-dim">
        <span class="col-acc">acc</span>
        <span class="col-bank">bank</span>
        <span class="col-score">score</span>
        <span class="col-bar">progress</span>
        <span class="col-dur">duration</span>
        <span class="col-date">completed</span>
      </div>
      <div class="ascii-rule-thin text-dim">------------------------------------------------------------</div>

      <div
        v-for="session in history"
        :key="session.id"
        class="session-row"
        role="listitem"
      >
        <span class="col-acc" :class="accuracyClass(session.accuracyPct)">{{ session.accuracyPct }}%</span>
        <span class="col-bank text-cyan">> {{ session.bankTitle }}</span>
        <span class="col-score">
          <span class="text-green">{{ session.correctCount }}</span>
          <span class="text-dim">/</span>
          <span class="text-red">{{ session.incorrectCount }}</span>
          <span class="text-dim">/{{ session.totalQuestions }}</span>
        </span>
        <span class="col-bar">
          <span :class="accuracyClass(session.accuracyPct)">{{
            '[' +
            '='.repeat(Math.max(0, Math.round(session.accuracyPct / 10) - 1)) +
            (session.accuracyPct > 0 ? '>' : '') +
            ' '.repeat(10 - Math.round(session.accuracyPct / 10)) +
            ']'
          }}</span>
        </span>
        <span class="col-dur text-dim">{{ formatDuration(session.durationMs) }}</span>
        <span class="col-date text-dim">{{ formatTimestamp(session.completedAt) }}</span>
      </div>
    </div>

    <ConfirmDialog
      v-if="showClearConfirm"
      title="Clear History"
      message="Clear all practice session history? This cannot be undone."
      confirm-label="Clear All"
      :danger="true"
      @confirm="confirmClear"
      @cancel="showClearConfirm = false"
    />
  </div>
</template>

<style scoped>
.history-view {
  padding: var(--space-6) var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  font-family: var(--font-mono);
}

.history-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}
.view-title {
  font-size: 16px;
  font-weight: 700;
  display: flex;
  gap: var(--space-2);
  align-items: center;
  flex: 1;
}

.header-actions { display: flex; align-items: center; gap: var(--space-4); font-size: 13px; }

/* ASCII rules */
.ascii-rule {
  font-size: 12.5px;
  opacity: 0.25;
  overflow: hidden;
  white-space: nowrap;
}
.ascii-rule-thin {
  font-size: 12.5px;
  opacity: 0.2;
  overflow: hidden;
  white-space: nowrap;
  padding: 2px 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: 13px;
  padding: var(--space-4) 0;
  border-left: 2px solid var(--border-dim);
  padding-left: var(--space-4);
}

/* Table layout */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  font-size: 12.5px;
}

.row-head,
.session-row {
  display: grid;
  grid-template-columns: 48px 2fr 80px 110px 70px 1fr;
  gap: var(--space-4);
  align-items: center;
  padding: 3px 0;
}

.row-head {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.8px;
  opacity: 0.85;
  text-transform: uppercase;
  border-left: 2px solid transparent;
  padding-left: var(--space-2);
}

.session-row {
  border-left: 2px solid transparent;
  padding-left: var(--space-2);
  transition: border-color var(--transition-fast), color var(--transition-fast);
}
.session-row:hover {
  border-left-color: var(--border-dim);
}

.col-acc  { font-weight: 700; font-size: 13px; }
.col-bank { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Buttons */
.btn-cli {
  font-family: var(--font-mono);
  font-size: 12.5px;
  padding: 2px 8px;
  background: none;
  border: 1px solid var(--border-normal);
  color: var(--color-muted);
  cursor: pointer;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}
.btn-cli:hover { color: var(--ansi-cyan); border-color: var(--ansi-cyan); }
.btn-cli-danger:hover { color: var(--ansi-red) !important; border-color: var(--ansi-red) !important; }
</style>

