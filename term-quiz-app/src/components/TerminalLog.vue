<script setup lang="ts">
// TerminalLog — Collapsible terminal output panel at the bottom of the shell
import { ref, nextTick, watch } from 'vue'
import { useTerminalLog } from '../services/terminalLog'

const { entries, clear } = useTerminalLog()
const collapsed = ref(false)
const logBody = ref<HTMLElement | null>(null)

function toggle() {
  collapsed.value = !collapsed.value
}

// Level → display tag and color class
const levelMeta: Record<string, { tag: string; cls: string }> = {
  info:  { tag: 'INFO',  cls: 'lvl-info' },
  ok:    { tag: 'OK',    cls: 'lvl-ok' },
  warn:  { tag: 'WARN',  cls: 'lvl-warn' },
  error: { tag: 'ERROR', cls: 'lvl-error' },
  quiz:  { tag: 'QUIZ',  cls: 'lvl-quiz' },
  debug: { tag: 'DEBUG', cls: 'lvl-debug' },
}

function meta(level: string) {
  return levelMeta[level] ?? { tag: level.toUpperCase(), cls: 'lvl-info' }
}

// Auto-scroll when new entries arrive
watch(entries, async () => {
  if (collapsed.value) return
  await nextTick()
  if (logBody.value) logBody.value.scrollTop = 0
})
</script>

<template>
  <div class="log-panel" :class="{ collapsed }">
    <!-- Panel header / toggle bar -->
    <div class="log-header" @click="toggle" role="button" :aria-expanded="!collapsed" aria-controls="log-body" tabindex="0" @keydown.enter="toggle" @keydown.space.prevent="toggle">
      <span class="log-title">
        <span class="text-green" aria-hidden="true">■</span>
        TERMINAL OUTPUT
      </span>
      <span class="log-count text-dim">{{ entries.length }} entries</span>
      <button
        class="log-clear text-dim"
        @click.stop="clear"
        title="Clear log"
        aria-label="Clear terminal log"
      >✕ clear</button>
      <span class="log-toggle text-muted" aria-hidden="true">{{ collapsed ? '▲' : '▼' }}</span>
    </div>

    <!-- Log entries -->
    <div id="log-body" class="log-body" ref="logBody" v-show="!collapsed" role="log" aria-live="polite" aria-label="Terminal output log">
      <div v-if="entries.length === 0" class="log-empty text-dim">
        — no messages —
      </div>
      <div
        v-for="entry in entries"
        :key="entry.id"
        class="log-entry"
      >
        <span class="log-time text-dim">{{ entry.timestamp }}</span>
        <span :class="['log-level', meta(entry.level).cls]">[{{ meta(entry.level).tag }}]</span>
        <span class="log-msg">{{ entry.message }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.log-panel {
  border-top: 1px solid var(--border-dim);
  background: var(--bg-panel);
  flex-shrink: 0;
  transition: height var(--transition-normal);
}

.log-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
  user-select: none;
  font-size: 11px;
  letter-spacing: 0.5px;
}
.log-header:hover { background: var(--bg-panel-hover); }

.log-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 10px;
  letter-spacing: 1px;
  color: var(--color-muted);
}

.log-count { margin-left: auto; font-size: 11px; }

.log-clear {
  background: none;
  border: none;
  font-size: 10px;
  padding: 2px 6px;
  font-family: var(--font-mono);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast), border-color var(--transition-fast);
}
.log-clear:hover { color: var(--ansi-red); border-color: var(--ansi-red); }

.log-toggle { font-size: 10px; }

.log-body {
  height: var(--log-height);
  overflow-y: auto;
  padding: var(--space-2) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.log-empty {
  font-size: 12px;
  text-align: center;
  padding: var(--space-4);
  font-style: italic;
}

.log-entry {
  display: flex;
  gap: var(--space-3);
  font-size: 12px;
  line-height: 1.4;
  align-items: baseline;
}

.log-time {
  flex-shrink: 0;
  font-size: 11px;
  min-width: 60px;
}

.log-level {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  min-width: 54px;
}

.log-msg {
  color: var(--color-text);
  word-break: break-word;
}

/* Level colors */
.lvl-info  { color: var(--ansi-cyan); }
.lvl-ok    { color: var(--ansi-green); }
.lvl-warn  { color: var(--ansi-yellow); }
.lvl-error { color: var(--ansi-red); }
.lvl-quiz  { color: var(--ansi-magenta); }
.lvl-debug { color: var(--ansi-dim); }

.collapsed .log-body { display: none; }
</style>
