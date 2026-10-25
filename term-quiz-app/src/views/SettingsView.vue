<script setup lang="ts">
// SettingsView — App settings: animations, feedback mode, storage info
import { computed } from 'vue'
import { useSettings } from '../services/appSettings'
import { useTerminalLog } from '../services/terminalLog'
import { isStorageAvailable, listBanks } from '../services/bankStorage'
import { getHistory } from '../services/sessionHistory'

const { settings } = useSettings()
const { info } = useTerminalLog()

info('Settings loaded.')

const storageOk = computed(() => isStorageAvailable())
const bankCount = computed(() => listBanks().length)
const historyCount = computed(() => getHistory().length)

function estimateStorageUsage(): string {
  try {
    let total = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('termquiz_')) {
        total += (localStorage.getItem(key) ?? '').length
      }
    }
    return (total / 1024).toFixed(1) + ' KB'
  } catch {
    return 'unknown'
  }
}
</script>

<template>
  <div class="settings-view">

    <div class="settings-header">
      <h1 class="view-title">
        <span class="text-cyan">$</span> settings
      </h1>
    </div>

    <!-- Behavior settings -->
    <section class="settings-section" aria-labelledby="section-behavior">
      <h2 id="section-behavior" class="section-title">
        <span class="text-cyan">//</span> behavior
      </h2>

      <div class="setting-row">
        <div class="setting-info">
          <label for="toggle-animations" class="setting-name">Enable Animations</label>
          <p class="setting-desc text-dim">Startup typing effects and UI micro-animations. Respects system reduced-motion preference.</p>
        </div>
        <button
          id="toggle-animations"
          class="toggle-btn"
          :class="{ active: settings.animationsEnabled }"
          @click="settings.animationsEnabled = !settings.animationsEnabled"
          :aria-pressed="settings.animationsEnabled"
          role="switch"
        >
          <span class="toggle-track">
            <span class="toggle-thumb"></span>
          </span>
          <span class="toggle-label">{{ settings.animationsEnabled ? 'ON' : 'OFF' }}</span>
        </button>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <label for="toggle-feedback" class="setting-name">Immediate Feedback</label>
          <p class="setting-desc text-dim">Show correct/incorrect feedback immediately after answering each question.</p>
        </div>
        <button
          id="toggle-feedback"
          class="toggle-btn"
          :class="{ active: settings.immediateFeeback }"
          @click="settings.immediateFeeback = !settings.immediateFeeback"
          :aria-pressed="settings.immediateFeeback"
          role="switch"
        >
          <span class="toggle-track">
            <span class="toggle-thumb"></span>
          </span>
          <span class="toggle-label">{{ settings.immediateFeeback ? 'ON' : 'OFF' }}</span>
        </button>
      </div>
    </section>

    <!-- Storage info -->
    <section class="settings-section" aria-labelledby="section-storage">
      <h2 id="section-storage" class="section-title">
        <span class="text-cyan">//</span> storage
      </h2>

      <div class="info-grid">
        <div class="info-row">
          <span class="info-label text-dim">Status</span>
          <span :class="storageOk ? 'text-green' : 'text-red'">
            {{ storageOk ? '● available' : '✗ unavailable' }}
          </span>
        </div>
        <div class="info-row">
          <span class="info-label text-dim">Question banks</span>
          <span class="text-cyan">{{ bankCount }}</span>
        </div>
        <div class="info-row">
          <span class="info-label text-dim">Session history</span>
          <span class="text-orange">{{ historyCount }} sessions</span>
        </div>
        <div class="info-row">
          <span class="info-label text-dim">Estimated usage</span>
          <span class="text-muted">{{ estimateStorageUsage() }}</span>
        </div>
      </div>

      <div class="storage-notice">
        <span class="text-yellow" aria-hidden="true">⚠</span>
        <p class="text-dim">
          Data is stored in browser localStorage. It may be cleared by your browser or when clearing site data.
          Export your question banks regularly as backups.
        </p>
      </div>
    </section>

    <!-- Keyboard shortcuts -->
    <section class="settings-section" aria-labelledby="section-shortcuts">
      <h2 id="section-shortcuts" class="section-title">
        <span class="text-cyan">//</span> keyboard shortcuts (during quiz)
      </h2>
      <div class="shortcuts-table">
        <div class="shortcut-row">
          <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd><kbd>4</kbd>
          <span class="text-dim">or</span>
          <kbd>A</kbd><kbd>B</kbd><kbd>C</kbd><kbd>D</kbd>
          <span>— select answer option (1=A, 2=B, 3=C, 4=D)</span>
        </div>
        <div class="shortcut-row">
          <kbd>Enter</kbd>
          <span>— submit answer / advance to next question</span>
        </div>
        <div class="shortcut-row">
          <kbd>Esc</kbd>
          <span>— close dialogs</span>
        </div>
      </div>
    </section>

    <!-- About -->
    <section class="settings-section" aria-labelledby="section-about">
      <h2 id="section-about" class="section-title">
        <span class="text-cyan">//</span> about
      </h2>
      <div class="info-grid">
        <div class="info-row">
          <span class="info-label text-dim">Application</span>
          <span class="text-green">TermQuiz v1.0.0</span>
        </div>
        <div class="info-row">
          <span class="info-label text-dim">Schema version</span>
          <span class="text-muted">1</span>
        </div>
        <div class="info-row">
          <span class="info-label text-dim">Stack</span>
          <span class="text-muted">Vue 3 + Vite + TypeScript</span>
        </div>
        <div class="info-row">
          <span class="info-label text-dim">Storage</span>
          <span class="text-muted">localStorage (local-first, no cloud)</span>
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>
.settings-view {
  padding: var(--space-6) var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  width: 100%;
  max-width: 1100px;
}

.view-title {
  font-size: 16px;
  font-weight: 700;
  font-family: var(--font-mono);
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.section-title {
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--color-muted);
  display: flex;
  gap: var(--space-2);
  align-items: center;
  border-bottom: 1px solid var(--border-dim);
  padding-bottom: var(--space-2);
}

.setting-row {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  padding: var(--space-4) var(--space-5);
  background: var(--bg-panel);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
}

.setting-info { flex: 1; }
.setting-name { font-size: 14px; font-weight: 500; color: var(--color-text); display: block; margin-bottom: var(--space-1); }
.setting-desc { font-size: 12.5px; line-height: 1.5; }

/* Toggle */
.toggle-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: var(--color-dim);
  flex-shrink: 0;
}

.toggle-track {
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: var(--bg-input);
  border: 1px solid var(--border-normal);
  position: relative;
  display: block;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-dim);
  transition: transform var(--transition-fast), background var(--transition-fast);
  display: block;
}

.toggle-btn.active .toggle-track {
  background: rgba(80,250,123,0.15);
  border-color: var(--ansi-green);
}
.toggle-btn.active .toggle-thumb {
  transform: translateX(16px);
  background: var(--ansi-green);
}
.toggle-btn.active { color: var(--ansi-green); }

/* Info grid */
.info-grid {
  background: var(--bg-panel);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.info-row {
  display: flex;
  gap: var(--space-6);
  padding: var(--space-3) var(--space-5);
  font-size: 13px;
  border-bottom: 1px solid var(--border-dim);
  align-items: center;
}
.info-row:last-child { border-bottom: none; }
.info-label { min-width: 160px; flex-shrink: 0; font-size: 12.5px; }

/* Storage notice */
.storage-notice {
  display: flex;
  gap: var(--space-3);
  font-size: 12.5px;
  line-height: 1.6;
  padding: var(--space-4);
  background: rgba(241,250,140,0.04);
  border: 1px solid rgba(241,250,140,0.2);
  border-radius: var(--radius-sm);
}

/* Shortcuts */
.shortcuts-table {
  background: var(--bg-panel);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.shortcut-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  font-size: 13px;
  border-bottom: 1px solid var(--border-dim);
  flex-wrap: wrap;
}
.shortcut-row:last-child { border-bottom: none; }

kbd {
  background: var(--bg-input);
  border: 1px solid var(--border-normal);
  border-radius: var(--radius-sm);
  padding: 2px 6px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: var(--ansi-cyan);
}
.text-orange { color: var(--ansi-orange); }
</style>
