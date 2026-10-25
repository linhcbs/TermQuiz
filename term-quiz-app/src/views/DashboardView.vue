<script setup lang="ts">
// DashboardView — Home screen with system info and quick actions
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { listBanks, saveBank, bankExists, isStorageAvailable } from '../services/bankStorage'
import { getHistory } from '../services/sessionHistory'
import { useTerminalLog } from '../services/terminalLog'
import { formatTimestamp, formatDuration } from '../utils/helpers'
import { DEMO_BANKS } from '../data/demoBanks'

const router = useRouter()
const { info, ok, warn } = useTerminalLog()

const refreshKey = ref(0)
const banks = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  refreshKey.value
  return listBanks()
})
const history = computed(() => getHistory().slice(0, 5))
const storageOk = computed(() => isStorageAvailable())

const totalQuestions = computed(() =>
  banks.value.reduce((sum, b) => sum + b.questions.length, 0),
)

onMounted(() => {
  info('TermQuiz ready.')
  if (!storageOk.value) {
    warn('localStorage is unavailable. Data will not persist between sessions.')
  } else {
    ok(`Loaded ${banks.value.length} question bank(s).`)
  }
})

function loadDemo() {
  let count = 0
  for (const demo of DEMO_BANKS) {
    if (!bankExists(demo.id)) {
      saveBank(demo)
      count++
    }
  }
  refreshKey.value++
  if (count > 0) {
    ok(`Loaded ${count} demo question bank(s).`)
  } else {
    info('Demo banks are already loaded.')
  }
}

function accuracyClass(pct: number): string {
  if (pct >= 80) return 'text-green'
  if (pct >= 50) return 'text-yellow'
  return 'text-red'
}
</script>

<template>
  <div class="dashboard">

    <!-- Boot sequence header -->
    <div class="boot-header">
      <div class="boot-line text-dim">
        <span class="text-green">●</span> TermQuiz v1.0.0
      </div>
      <div class="boot-line">
        <span class="text-cyan">student@termquiz</span>
        <span class="text-dim">:</span>
        <span class="text-blue">~/question-banks</span>
        <span class="text-dim">$ </span>
        <span class="text-green">termquiz --status</span>
      </div>
    </div>

    <!-- Stats row -->
    <div class="stats-row">
      <div class="stat-block">
        <span class="stat-value text-cyan">{{ banks.length }}</span>
        <span class="stat-label text-dim">question banks</span>
      </div>
      <span class="stat-sep text-dim">|</span>
      <div class="stat-block">
        <span class="stat-value text-magenta">{{ totalQuestions }}</span>
        <span class="stat-label text-dim">total questions</span>
      </div>
      <span class="stat-sep text-dim">|</span>
      <div class="stat-block">
        <span class="stat-value text-orange">{{ history.length }}</span>
        <span class="stat-label text-dim">recent sessions</span>
      </div>
      <span class="stat-sep text-dim">|</span>
      <div class="stat-block">
        <span class="stat-value" :class="storageOk ? 'text-green' : 'text-red'">
          {{ storageOk ? 'OK' : 'WARN' }}
        </span>
        <span class="stat-label text-dim">storage</span>
      </div>
    </div>

    <div class="ascii-rule text-dim">------------------------------------------------------------</div>

    <!-- Empty welcome banner -->
    <div v-if="banks.length === 0" class="section">
      <div class="welcome-banner">
        <span class="text-yellow">[!]</span>
        <div>
          <div class="text-yellow" style="font-weight: 600; font-family: var(--font-mono);">
            Welcome to TermQuiz!
          </div>
          <div class="text-dim" style="font-size: 13px;">
            No question banks found. Load the sample demo banks to explore Linux CLI &amp; Git questions.
          </div>
        </div>
        <button id="dash-load-demo" class="btn-cli" @click="loadDemo">
          [+ load demo]
        </button>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="section">
      <div class="section-header text-dim">
        <span class="text-cyan">//</span> quick actions
      </div>
      <div class="action-grid">
        <button id="dash-goto-banks" class="action-card" @click="router.push('/banks')">
          <span class="action-icon text-cyan">&gt;</span>
          <span class="action-label">Question Banks</span>
          <span class="action-desc text-dim">manage your banks</span>
        </button>
        <button id="dash-goto-create" class="action-card" @click="router.push('/banks/new')">
          <span class="action-icon text-green">&gt;</span>
          <span class="action-label">New Bank</span>
          <span class="action-desc text-dim">create a question bank</span>
        </button>
        <button id="dash-goto-import" class="action-card" @click="router.push('/banks?action=import')">
          <span class="action-icon text-magenta">&gt;</span>
          <span class="action-label">Import Bank</span>
          <span class="action-desc text-dim">import from JSON file</span>
        </button>
        <button id="dash-goto-history" class="action-card" @click="router.push('/history')">
          <span class="action-icon text-orange">&gt;</span>
          <span class="action-label">History</span>
          <span class="action-desc text-dim">view past sessions</span>
        </button>
      </div>
    </div>

    <div class="ascii-rule text-dim">------------------------------------------------------------</div>

    <!-- Recent sessions -->
    <div v-if="history.length > 0" class="section">
      <div class="section-header text-dim">
        <span class="text-cyan">//</span> recent sessions
      </div>
      <div class="history-table">
        <div class="history-row history-head text-dim">
          <span>bank</span>
          <span>score</span>
          <span>accuracy</span>
          <span>duration</span>
          <span>completed</span>
        </div>
        <div class="ascii-rule-thin text-dim">------------------------------------------------------------</div>
        <div
          v-for="s in history"
          :key="s.id"
          class="history-row"
        >
          <span class="text-cyan">> {{ s.bankTitle }}</span>
          <span>{{ s.correctCount }}/{{ s.totalQuestions }}</span>
          <span :class="accuracyClass(s.accuracyPct)">{{ s.accuracyPct }}%</span>
          <span class="text-dim">{{ formatDuration(s.durationMs) }}</span>
          <span class="text-dim">{{ formatTimestamp(s.completedAt) }}</span>
        </div>
      </div>
    </div>

    <!-- No banks CTA -->
    <div v-if="banks.length === 0" class="empty-cta">
      <span class="text-yellow">[!]</span>
      <div class="empty-cta-content">
        <p>No question banks found.</p>
        <p class="text-dim">Create a new bank or import an existing JSON file to get started.</p>
      </div>
      <button id="dash-cta-create" class="btn-cli btn-cli-active" @click="router.push('/banks/new')">
        [+ create a bank]
      </button>
    </div>

  </div>
</template>

<style scoped>
.dashboard {
  padding: var(--space-6) var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  width: 100%;
  max-width: 1200px;
  font-family: var(--font-mono);
}

/* Boot header */
.boot-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: 13px;
}
.boot-line {
  display: flex;
  gap: var(--space-1);
  flex-wrap: wrap;
}
.text-blue { color: var(--ansi-blue); }

/* Stats inline row */
.stats-row {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  flex-wrap: wrap;
  font-size: 13px;
}
.stat-block {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}
.stat-value {
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
}
.stat-label { font-size: 11px; }
.stat-sep { opacity: 0.3; }

/* ASCII rules */
.ascii-rule {
  font-size: 12px;
  opacity: 0.25;
  overflow: hidden;
  white-space: nowrap;
}
.ascii-rule-thin {
  font-size: 12px;
  opacity: 0.2;
  overflow: hidden;
  white-space: nowrap;
  padding: 2px 0;
}

/* Sections */
.section { display: flex; flex-direction: column; gap: var(--space-3); }
.section-header {
  font-size: 11px;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* Welcome banner */
.welcome-banner {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  font-size: 13px;
  flex-wrap: wrap;
  padding: var(--space-2) 0;
  border-left: 2px solid var(--ansi-yellow);
  padding-left: var(--space-4);
}

/* Action grid — 4 equal CLI-style cards */
.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}

.action-card {
  background: none;
  border: none;
  border-left: 2px solid var(--border-dim);
  padding: var(--space-3) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  cursor: pointer;
  text-align: left;
  transition: border-color var(--transition-fast), color var(--transition-fast);
  font-family: var(--font-mono);
}
.action-card:hover {
  border-left-color: var(--ansi-cyan);
}
.action-icon { font-size: 13px; font-weight: 700; }
.action-label { font-size: 13px; font-weight: 700; color: var(--color-text); }
.action-desc { font-size: 11px; }

/* History table — plain rows, no boxes */
.history-table {
  display: flex;
  flex-direction: column;
  font-size: 12px;
}
.history-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 2fr;
  gap: var(--space-4);
  padding: 4px 0;
}
.history-head {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.8px;
  opacity: 0.85;
  text-transform: uppercase;
}

/* Empty CTA */
.empty-cta {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  font-size: 13px;
  flex-wrap: wrap;
  border-left: 2px solid var(--ansi-yellow);
  padding-left: var(--space-4);
}
.empty-cta-content { flex: 1; display: flex; flex-direction: column; gap: var(--space-1); }

/* Buttons */
.btn-cli {
  font-family: var(--font-mono);
  font-size: 12px;
  padding: 2px 10px;
  background: none;
  border: 1px solid var(--border-normal);
  color: var(--color-muted);
  cursor: pointer;
  transition: color var(--transition-fast), border-color var(--transition-fast);
  flex-shrink: 0;
}
.btn-cli:hover {
  color: var(--ansi-cyan);
  border-color: var(--ansi-cyan);
}
.btn-cli-active {
  color: var(--ansi-green);
  border-color: var(--ansi-green);
}
.text-magenta { color: var(--ansi-magenta); }
.text-orange { color: var(--ansi-orange); }
</style>

