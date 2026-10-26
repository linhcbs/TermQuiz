<script setup lang="ts">
// QuestionBanksView — List, create, edit, delete, import/export question banks
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { QuestionBank } from '../types'
import { listBanks, saveBank, deleteBank, bankExists } from '../services/bankStorage'
import { importBankFromFile, exportBankToFile } from '../services/bankImportExport'
import { removeHistoryForBank } from '../services/sessionHistory'
import { useTerminalLog } from '../services/terminalLog'
import { generateId, formatTimestamp } from '../utils/helpers'
import { DEMO_BANKS } from '../data/demoBanks'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const router = useRouter()
const route = useRoute()
const { info, ok, warn, error: logError } = useTerminalLog()

// ─── State ────────────────────────────────────────────────────

const banks = ref<QuestionBank[]>([])
const searchQuery = ref('')
const sortBy = ref<'updated' | 'title' | 'questions'>('updated')

// Delete dialog
const deleteTarget = ref<QuestionBank | null>(null)

// Import
const importInput = ref<HTMLInputElement | null>(null)
const importError = ref<string[]>([])
const importWarnings = ref<string[]>([])
const importPreview = ref<{ bank: QuestionBank; warnings: string[] } | null>(null)
const importConflict = ref<'overwrite' | null>(null)

// ─── Computed ─────────────────────────────────────────────────

const filtered = computed(() => {
  let result = [...banks.value]
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter((b) => b.title.toLowerCase().includes(q) || b.description.toLowerCase().includes(q))
  }
  switch (sortBy.value) {
    case 'title':
      result.sort((a, b) => a.title.localeCompare(b.title))
      break
    case 'questions':
      result.sort((a, b) => b.questions.length - a.questions.length)
      break
    default:
      result.sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))
  }
  return result
})

// ─── Keyboard Navigation ──────────────────────────────────────

const toolbarIds = [
  'search-banks',
  'sort-banks',
  'btn-load-demo',
  'btn-guide',
  'btn-import-bank',
  'btn-create-bank',
]

function getBankActionIds(bankId: string) {
  return [
    `btn-practice-${bankId}`,
    `btn-view-${bankId}`,
    `btn-export-${bankId}`,
    `btn-dup-${bankId}`,
    `btn-delete-${bankId}`,
  ]
}

function getAllInteractiveElements(): HTMLElement[] {
  const list: HTMLElement[] = []
  for (const id of toolbarIds) {
    const el = document.getElementById(id)
    if (el) list.push(el)
  }
  if (filtered.value.length > 0) {
    for (const b of filtered.value) {
      for (const id of getBankActionIds(b.id)) {
        const el = document.getElementById(id) as HTMLButtonElement | null
        if (el && !el.disabled) list.push(el)
      }
    }
  } else {
    const btnNew = document.getElementById('banks-cta-new')
    if (btnNew) list.push(btnNew)
    const btnDemo = document.getElementById('banks-cta-demo')
    if (btnDemo) list.push(btnDemo)
  }
  return list
}

function focusElement(el: HTMLElement | null) {
  if (!el) return false
  el.focus()
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  return true
}

function getBankActionEl(bankIndex: number, colIndex: number): HTMLElement | null {
  if (bankIndex < 0 || bankIndex >= filtered.value.length) return null
  const b = filtered.value[bankIndex]
  const colIds = getBankActionIds(b.id)
  const clampedCol = Math.max(0, Math.min(colIndex, colIds.length - 1))
  let el = document.getElementById(colIds[clampedCol]) as HTMLButtonElement | null
  if (el && el.disabled) {
    for (let offset = 1; offset < colIds.length; offset++) {
      const nextCol = (clampedCol + offset) % colIds.length
      const nextEl = document.getElementById(colIds[nextCol]) as HTMLButtonElement | null
      if (nextEl && !nextEl.disabled) {
        el = nextEl
        break
      }
    }
  }
  return el
}

function handleKeyNavigation(e: KeyboardEvent) {
  if (deleteTarget.value || importPreview.value) return

  const navKeys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Tab', 'Enter']
  if (!navKeys.includes(e.key)) return

  const active = document.activeElement as HTMLElement | null
  const toolbarCol = toolbarIds.findIndex((id) => active?.id === id)

  let bankRow = -1
  let bankCol = -1
  if (toolbarCol === -1 && filtered.value.length > 0) {
    for (let i = 0; i < filtered.value.length; i++) {
      const b = filtered.value[i]
      const colIds = getBankActionIds(b.id)
      const c = colIds.findIndex((id) => active?.id === id)
      if (c !== -1) {
        bankRow = i + 1
        bankCol = c
        break
      }
    }
  }

  let emptyCol = -1
  if (toolbarCol === -1 && bankRow === -1) {
    if (active?.id === 'banks-cta-new') emptyCol = 0
    else if (active?.id === 'banks-cta-demo') emptyCol = 1
  }

  const isInside = toolbarCol !== -1 || bankRow !== -1 || emptyCol !== -1

  if (!isInside) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'Tab') {
      e.preventDefault()
      focusElement(document.getElementById(toolbarIds[0]))
    }
    return
  }

  if (e.key === 'Enter') {
    if (active && active.tagName === 'BUTTON') {
      e.preventDefault()
      active.click()
    }
    return
  }

  if (e.key === 'Tab') {
    const all = getAllInteractiveElements()
    if (all.length === 0) return
    const curIdx = all.indexOf(active!)
    e.preventDefault()
    if (e.shiftKey) {
      const prevIdx = curIdx <= 0 ? all.length - 1 : curIdx - 1
      focusElement(all[prevIdx])
    } else {
      const nextIdx = (curIdx + 1) % all.length
      focusElement(all[nextIdx])
    }
    return
  }

  // Toolbar navigation
  if (toolbarCol !== -1) {
    if (e.key === 'ArrowRight') {
      if (toolbarCol === 0) {
        const input = active as HTMLInputElement
        const atEnd = !input.value || (input.selectionStart === input.value.length && input.selectionEnd === input.value.length)
        if (!atEnd) return
      }
      e.preventDefault()
      const nextCol = (toolbarCol + 1) % toolbarIds.length
      focusElement(document.getElementById(toolbarIds[nextCol]))
      return
    }

    if (e.key === 'ArrowLeft') {
      if (toolbarCol === 0) {
        const input = active as HTMLInputElement
        const atStart = !input.value || (input.selectionStart === 0 && input.selectionEnd === 0)
        if (!atStart) return
      }
      e.preventDefault()
      const prevCol = (toolbarCol - 1 + toolbarIds.length) % toolbarIds.length
      focusElement(document.getElementById(toolbarIds[prevCol]))
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (filtered.value.length > 0) {
        const targetCol = Math.min(toolbarCol, 4)
        focusElement(getBankActionEl(0, targetCol))
      } else {
        focusElement(document.getElementById('banks-cta-new') || document.getElementById('banks-cta-demo'))
      }
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (filtered.value.length > 0) {
        const targetCol = Math.min(toolbarCol, 4)
        focusElement(getBankActionEl(filtered.value.length - 1, targetCol))
      }
      return
    }
  }

  // Bank row navigation
  if (bankRow !== -1) {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const nextCol = (bankCol + 1) % 5
      focusElement(getBankActionEl(bankRow - 1, nextCol))
      return
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prevCol = (bankCol - 1 + 5) % 5
      focusElement(getBankActionEl(bankRow - 1, prevCol))
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (bankRow < filtered.value.length) {
        focusElement(getBankActionEl(bankRow, bankCol))
      } else {
        const targetCol = Math.min(bankCol, toolbarIds.length - 1)
        focusElement(document.getElementById(toolbarIds[targetCol]))
      }
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (bankRow > 1) {
        focusElement(getBankActionEl(bankRow - 2, bankCol))
      } else {
        const targetCol = Math.min(bankCol, toolbarIds.length - 1)
        focusElement(document.getElementById(toolbarIds[targetCol]))
      }
      return
    }
  }

  // Empty state CTA navigation
  if (emptyCol !== -1) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const otherId = active?.id === 'banks-cta-new' ? 'banks-cta-demo' : 'banks-cta-new'
      focusElement(document.getElementById(otherId))
      return
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      focusElement(document.getElementById(toolbarIds[0]))
      return
    }
  }
}

// ─── Lifecycle ────────────────────────────────────────────────

function refresh() {
  banks.value = listBanks()
}

onMounted(() => {
  refresh()
  info('Loaded question banks.')
  window.addEventListener('keydown', handleKeyNavigation)
  // Handle ?action=import from dashboard
  if (route.query.action === 'import') {
    triggerImport()
    router.replace('/banks')
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyNavigation)
})

// ─── Import ───────────────────────────────────────────────────

function triggerImport() {
  importError.value = []
  importWarnings.value = []
  importPreview.value = null
  importInput.value?.click()
}

async function handleImportFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (importInput.value) importInput.value.value = ''

  info(`Importing: ${file.name}`)
  const result = await importBankFromFile(file)

  if (!result.success || !result.bank) {
    importError.value = result.errors
    logError(`Import failed: ${result.errors[0]}`)
    return
  }

  importError.value = []
  importWarnings.value = result.warnings

  // Check for ID conflict
  if (bankExists(result.bank.id)) {
    importConflict.value = 'overwrite'
    importPreview.value = { bank: result.bank, warnings: result.warnings }
    warn(`Bank ID "${result.bank.id}" already exists. Confirm overwrite.`)
  } else {
    importPreview.value = { bank: result.bank, warnings: result.warnings }
  }
}

function confirmImport() {
  if (!importPreview.value) return

  try {
    saveBank(importPreview.value.bank)
    ok(`Imported: ${importPreview.value.bank.title} (${importPreview.value.bank.questions.length} questions)`)
    importPreview.value = null
    importConflict.value = null
    refresh()
  } catch (e) {
    logError(String(e))
  }
}

function cancelImport() {
  importPreview.value = null
  importConflict.value = null
  importError.value = []
}

// ─── Export ───────────────────────────────────────────────────

function exportBank(bank: QuestionBank) {
  exportBankToFile(bank)
  ok(`Exported: ${bank.title}`)
}

// ─── Delete ───────────────────────────────────────────────────

function confirmDelete() {
  if (!deleteTarget.value) return
  const id = deleteTarget.value.id
  const title = deleteTarget.value.title
  deleteBank(id)
  removeHistoryForBank(id)
  ok(`Deleted: ${title}`)
  deleteTarget.value = null
  refresh()
}

// ─── Duplicate ────────────────────────────────────────────────

function duplicateBank(bank: QuestionBank) {
  const now = new Date().toISOString()
  const copy: QuestionBank = {
    ...bank,
    id: generateId('bank'),
    title: `${bank.title} (copy)`,
    createdAt: now,
    updatedAt: now,
  }
  saveBank(copy)
  ok(`Duplicated: ${bank.title}`)
  refresh()
}

// ─── Demo Banks ───────────────────────────────────────────────

function loadDemoBanks() {
  let count = 0
  for (const demo of DEMO_BANKS) {
    if (!bankExists(demo.id)) {
      saveBank(demo)
      count++
    }
  }
  if (count > 0) {
    ok(`Loaded ${count} demo question bank(s).`)
  } else {
    info('Demo question banks are already loaded.')
  }
  refresh()
}
</script>

<template>
  <div class="banks-view">

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h1 class="view-title">
          <span class="text-cyan">$</span> question-banks
        </h1>
        <span class="count-badge text-dim">{{ banks.length }} banks</span>
      </div>
      <div class="toolbar-right">
        <input
          id="search-banks"
          v-model="searchQuery"
          type="search"
          placeholder="search banks…"
          class="search-input"
          aria-label="Search question banks"
        />
        <select id="sort-banks" v-model="sortBy" class="sort-select" aria-label="Sort by">
          <option value="updated">sort: updated</option>
          <option value="title">sort: title</option>
          <option value="questions">sort: questions</option>
        </select>
        <button id="btn-load-demo" class="btn btn-secondary" title="Load sample demo question banks" @click="loadDemoBanks">demo banks</button>
        <button id="btn-guide" class="btn btn-ghost" title="AI Prompt & JSON Format Guide" @click="router.push('/guide')">? format guide</button>
        <button id="btn-import-bank" class="btn btn-secondary" @click="triggerImport">↓ import</button>
        <button id="btn-create-bank" class="btn btn-primary" @click="router.push('/banks/new')">+ new bank</button>
        <input
          ref="importInput"
          type="file"
          accept=".json"
          class="sr-only"
          @change="handleImportFile"
          aria-label="Import question bank JSON file"
        />
      </div>
    </div>

    <!-- Import errors -->
    <div v-if="importError.length > 0" class="import-error" role="alert">
      <div class="import-error-title text-red">✗ Import failed</div>
      <ul class="import-error-list">
        <li v-for="e in importError" :key="e">{{ e }}</li>
      </ul>
      <button class="btn-close text-dim" @click="importError = []">dismiss</button>
    </div>

    <!-- Import preview -->
    <div v-if="importPreview" class="import-preview" role="region" aria-label="Import preview">
      <div class="preview-header">
        <span class="text-green">↓</span>
        <span>Import Preview</span>
        <span v-if="importConflict" class="text-yellow">(ID conflict — will overwrite existing bank)</span>
      </div>
      <div class="preview-details">
        <span class="text-cyan">{{ importPreview.bank.title }}</span>
        <span class="text-dim"> — {{ importPreview.bank.questions.length }} questions</span>
      </div>
      <div v-if="importPreview.warnings.length > 0" class="preview-warnings">
        <div v-for="w in importPreview.warnings" :key="w" class="text-yellow text-sm">⚠ {{ w }}</div>
      </div>
      <div class="preview-actions">
        <button id="btn-cancel-import" class="btn btn-secondary" @click="cancelImport">cancel</button>
        <button id="btn-confirm-import" class="btn btn-primary" @click="confirmImport">
          {{ importConflict ? 'overwrite & import' : 'import bank' }}
        </button>
      </div>
    </div>

    <!-- Bank list -->
    <div v-if="filtered.length > 0" class="banks-list" role="list" aria-label="Question banks">
      <div
        v-for="bank in filtered"
        :key="bank.id"
        class="bank-card"
        role="listitem"
      >
        <div class="bank-main">
          <div class="bank-info">
            <h2 class="bank-title">
              <span class="text-cyan" aria-hidden="true">▤</span>
              {{ bank.title }}
            </h2>
            <p v-if="bank.description" class="bank-desc text-muted">{{ bank.description }}</p>
            <div class="bank-meta text-dim">
              <span>{{ bank.questions.length }} questions</span>
              <span>·</span>
              <span>updated {{ formatTimestamp(bank.updatedAt) }}</span>
              <span>·</span>
              <span class="bank-id">id: {{ bank.id }}</span>
            </div>
          </div>

          <div class="bank-actions">
            <button
              :id="`btn-practice-${bank.id}`"
              class="btn btn-primary"
              :disabled="bank.questions.length === 0"
              @click="router.push(`/practice/${bank.id}`)"
              :title="bank.questions.length === 0 ? 'No questions in this bank' : 'Start practice session'"
            >
              ▶ practice
            </button>
            <button :id="`btn-view-${bank.id}`" class="btn btn-secondary" @click="router.push(`/banks/${bank.id}`)">view</button>
            <button :id="`btn-export-${bank.id}`" class="btn btn-ghost" @click="exportBank(bank)" title="Export as JSON">↓ export</button>
            <button :id="`btn-dup-${bank.id}`" class="btn btn-ghost" @click="duplicateBank(bank)" title="Duplicate bank">duplicate</button>
            <button :id="`btn-delete-${bank.id}`" class="btn btn-ghost btn-danger-ghost btn-delete" @click="deleteTarget = bank" title="Delete bank">✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="searchQuery" class="empty-state">
      <span class="text-dim">No banks matching "{{ searchQuery }}"</span>
    </div>

    <div v-else class="empty-state">
      <span class="text-yellow" aria-hidden="true">⚠</span>
      <div>
        <p>No question banks yet.</p>
        <p class="text-dim">Create a new bank, import a JSON file, or load the built-in demo banks.</p>
      </div>
      <div style="display: flex; gap: var(--space-3); flex-wrap: wrap; justify-content: center;">
        <button id="banks-cta-new" class="btn btn-primary" @click="router.push('/banks/new')">+ new bank</button>
        <button id="banks-cta-demo" class="btn btn-secondary" @click="loadDemoBanks">load demo banks</button>
      </div>
    </div>

    <!-- Delete confirm -->
    <ConfirmDialog
      v-if="deleteTarget"
      title="Delete Bank"
      :message="`Delete &quot;${deleteTarget.title}&quot;? This cannot be undone.`"
      confirm-label="Delete"
      :danger="true"
      @confirm="confirmDelete"
      @cancel="deleteTarget = null"
    />
  </div>
</template>

<style scoped>
.banks-view {
  padding: var(--space-6) var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
}
.view-title {
  font-size: 16px;
  font-weight: 700;
  font-family: var(--font-mono);
  display: flex;
  gap: var(--space-2);
  align-items: center;
}
.count-badge {
  font-size: 12.5px;
  background: var(--bg-panel);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  padding: 2px 8px;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.search-input { width: 200px; }
.sort-select { width: 140px; }

/* Import feedback */
.import-error {
  background: rgba(255,85,85,0.08);
  border: 1px solid var(--ansi-red);
  border-radius: var(--radius-sm);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: 13px;
}
.import-error-title { font-weight: 700; }
.import-error-list { padding-left: var(--space-5); color: var(--color-muted); }
.btn-close {
  background: none;
  border: none;
  font-family: var(--font-mono);
  font-size: 12.5px;
  cursor: pointer;
  align-self: flex-start;
}
.btn-close:hover { color: var(--color-text); }

.import-preview {
  background: rgba(80,250,123,0.04);
  border: 1px solid var(--ansi-green);
  border-radius: var(--radius-sm);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  font-size: 13px;
}
.preview-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-weight: 700;
  color: var(--color-text);
}
.preview-details { font-size: 14px; }
.preview-warnings { display: flex; flex-direction: column; gap: var(--space-1); font-size: 12.5px; }
.preview-actions { display: flex; gap: var(--space-3); }

/* Banks list */
.banks-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.bank-card {
  background: var(--bg-panel);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast);
}
.bank-card:hover { border-color: var(--border-bright); }

.bank-main {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  padding: var(--space-5) var(--space-6);
  flex-wrap: wrap;
}
.bank-info {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.bank-title {
  font-size: 15px;
  font-weight: 700;
  font-family: var(--font-mono);
  display: flex;
  gap: var(--space-2);
  align-items: center;
  color: var(--color-text);
}
.bank-desc { font-size: 13px; }
.bank-meta {
  font-size: 12.5px;
  display: flex;
  gap: var(--space-2);
  align-items: center;
  flex-wrap: wrap;
}
.bank-id { opacity: 0.85; font-size: 12.5px; }

.bank-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

/* Empty state */
.empty-state {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-8);
  border: 1px dashed var(--border-normal);
  border-radius: var(--radius-md);
  color: var(--color-muted);
  font-size: 14px;
  flex-wrap: wrap;
}

/* Buttons */
.btn {
  font-family: var(--font-mono);
  font-size: 12.5px;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  font-weight: 500;
}
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-primary {
  background: var(--ansi-cyan);
  color: #000;
  border-color: var(--ansi-cyan);
}
.btn-primary:hover:not(:disabled) { background: #a0f0ff; }
.btn-secondary {
  background: transparent;
  color: var(--color-muted);
  border-color: var(--border-normal);
}
.btn-secondary:hover { color: var(--color-text); border-color: var(--border-bright); }
.btn-ghost {
  background: transparent;
  color: var(--color-dim);
  border-color: transparent;
}
.btn-ghost:hover { color: var(--color-muted); border-color: var(--border-dim); }
.btn-danger-ghost:hover { color: var(--ansi-red) !important; border-color: var(--ansi-red) !important; }

.btn:focus,
.btn:focus-visible {
  outline: 2px solid var(--ansi-cyan);
  outline-offset: 2px;
}

.search-input:focus,
.search-input:focus-visible,
.sort-select:focus,
.sort-select:focus-visible {
  outline: 2px solid var(--ansi-cyan);
  outline-offset: 2px;
  border-color: var(--ansi-cyan);
}

/* ── Responsive adjustments for mobile ──────────────────────── */
@media (max-width: 640px) {
  .banks-view {
    padding: var(--space-4) var(--space-3);
    gap: var(--space-4);
  }

  .toolbar-right {
    width: 100%;
    gap: var(--space-2);
  }

  .search-input {
    width: 100%;
    min-width: 0;
  }

  .bank-main {
    padding: var(--space-4) var(--space-3);
    gap: var(--space-3);
  }

  .bank-actions {
    width: 100%;
    gap: var(--space-2);
  }

  /* Center delete button when it wraps alone onto a new row */
  .bank-actions .btn-delete {
    margin-left: auto;
    margin-right: auto;
    min-width: 44px;
    text-align: center;
  }
}
</style>
