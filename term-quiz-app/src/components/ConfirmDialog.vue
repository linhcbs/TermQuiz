<script setup lang="ts">
// ConfirmDialog — Modal confirmation dialog
// Used for destructive actions (delete, navigate away from quiz, etc.)
import { computed, onMounted, onUnmounted } from 'vue'

interface Props {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  confirmHotkey?: string
  cancelHotkey?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirm',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  danger: false,
  confirmHotkey: '',
  cancelHotkey: '',
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function formatLabelWithHotkey(label: string, hotkey?: string) {
  if (!hotkey) return { before: label, key: '', after: '' }
  const idx = label.toLowerCase().indexOf(hotkey.toLowerCase())
  if (idx === -1) return { before: label, key: '', after: '' }
  return {
    before: label.slice(0, idx),
    key: label.slice(idx, idx + 1),
    after: label.slice(idx + 1),
  }
}

const cancelParts = computed(() => formatLabelWithHotkey(props.cancelLabel, props.cancelHotkey))
const confirmParts = computed(() => formatLabelWithHotkey(props.confirmLabel, props.confirmHotkey))

function onKeyDown(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null
  const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA'

  if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    emit('cancel')
    return
  }

  if (e.key === 'Enter' && !isInput) {
    e.preventDefault()
    e.stopPropagation()
    emit('confirm')
    return
  }

  const pressed = e.key.toLowerCase()

  if (props.cancelHotkey && pressed === props.cancelHotkey.toLowerCase()) {
    e.preventDefault()
    e.stopPropagation()
    emit('cancel')
    return
  }

  if (props.confirmHotkey && pressed === props.confirmHotkey.toLowerCase()) {
    e.preventDefault()
    e.stopPropagation()
    emit('confirm')
    return
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown, { capture: true })
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown, { capture: true })
})
</script>

<template>
  <Teleport to="body">
    <div class="dialog-overlay" role="dialog" aria-modal="true" :aria-label="props.title" @click.self="emit('cancel')">
      <div class="dialog-box">
        <div class="dialog-header">
          <span class="dialog-icon" aria-hidden="true">{{ props.danger ? '⚠' : '?' }}</span>
          <h2 class="dialog-title">{{ props.title }}</h2>
        </div>
        <p class="dialog-message">{{ props.message }}</p>
        <div class="dialog-actions">
          <button id="dialog-cancel" class="btn btn-secondary" @click="emit('cancel')">
            <template v-if="cancelParts.key">
              {{ cancelParts.before }}<u class="hotkey-underline">{{ cancelParts.key }}</u>{{ cancelParts.after }}
            </template>
            <template v-else>
              {{ props.cancelLabel }}
            </template>
          </button>
          <button
            id="dialog-confirm"
            class="btn"
            :class="props.danger ? 'btn-danger' : 'btn-primary'"
            @click="emit('confirm')"
          >
            <template v-if="confirmParts.key">
              {{ confirmParts.before }}<u class="hotkey-underline">{{ confirmParts.key }}</u>{{ confirmParts.after }}
            </template>
            <template v-else>
              {{ props.confirmLabel }}
            </template>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 150ms ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.dialog-box {
  background: var(--bg-panel);
  border: 1px solid var(--border-bright);
  border-radius: var(--radius-md);
  padding: var(--space-8);
  max-width: 440px;
  width: 90%;
  animation: slideIn 150ms ease;
}

@keyframes slideIn {
  from { transform: translateY(-8px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.dialog-icon {
  font-size: 20px;
  color: var(--ansi-yellow);
}

.dialog-title {
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text);
}

.dialog-message {
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: var(--space-6);
}

.dialog-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}

/* ── Shared button styles ─────────────────────────────────────── */
.btn {
  font-family: var(--font-mono);
  font-size: 13px;
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
  font-weight: 500;
}

.btn-primary {
  background: var(--ansi-cyan);
  color: #000;
  border-color: var(--ansi-cyan);
}
.btn-primary:hover { background: #a0f0ff; }

.btn-secondary {
  background: transparent;
  color: var(--color-muted);
  border-color: var(--border-normal);
}
.btn-secondary:hover { color: var(--color-text); border-color: var(--border-bright); }

.btn-danger {
  background: var(--ansi-red);
  color: #fff;
  border-color: var(--ansi-red);
}
.btn-danger:hover { background: #ff7777; }

.hotkey-underline {
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 1.5px;
  font-weight: 700;
}
</style>
