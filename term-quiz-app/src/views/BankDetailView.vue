<script setup lang="ts">
// BankDetailView — View a single bank, add/edit/delete questions
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { QuestionBank, Question } from '../types'
import { SCHEMA_VERSION } from '../types'
import { getBank, saveBank } from '../services/bankStorage'
import { useTerminalLog } from '../services/terminalLog'
import { generateId, formatTimestamp } from '../utils/helpers'
import QuestionEditor from '../components/QuestionEditor.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const { info, ok, error: logError } = useTerminalLog()

// ─── State ────────────────────────────────────────────────────

const bank = ref<QuestionBank | null>(null)
const editingQuestion = ref<Question | null>(null)
const showEditor = ref(false)
const deleteQuestionTarget = ref<Question | null>(null)

// Bank metadata editing
const editingMeta = ref(false)
const metaTitle = ref('')
const metaDesc = ref('')
const metaErrors = ref<{ title?: string }>({})

const isNew = computed(() => route.path === '/banks/new' || route.name === 'banks-new' || route.params.id === 'new')

// ─── Load ─────────────────────────────────────────────────────

function load() {
  if (isNew.value) {
    // Create mode
    const now = new Date().toISOString()
    bank.value = {
      schemaVersion: SCHEMA_VERSION,
      id: generateId('bank'),
      title: '',
      description: '',
      createdAt: now,
      updatedAt: now,
      questions: [],
    }
    editingMeta.value = true
    metaTitle.value = ''
    metaDesc.value = ''
    info('Creating new question bank.')
  } else {
    const id = route.params.id as string
    if (!id) return
    const b = getBank(id)
    if (!b) {
      logError(`Bank "${id}" not found.`)
      router.replace('/banks')
      return
    }
    bank.value = b
    info(`Loaded bank: ${b.title}`)
  }
}

onMounted(load)
watch(() => route.path, load)

// ─── Save bank meta ───────────────────────────────────────────

function saveMeta() {
  if (!bank.value) return
  metaErrors.value = {}

  if (!metaTitle.value.trim()) {
    metaErrors.value.title = 'Bank title is required.'
    return
  }

  const now = new Date().toISOString()
  const updated: QuestionBank = {
    ...bank.value,
    title: metaTitle.value.trim(),
    description: metaDesc.value.trim(),
    updatedAt: now,
    ...(isNew.value ? { createdAt: now } : {}),
  }

  try {
    saveBank(updated)
    bank.value = updated
    editingMeta.value = false
    ok(`Saved: ${updated.title}`)

    if (isNew.value) {
      // Replace URL so back/refresh work
      router.replace(`/banks/${updated.id}`)
    }
  } catch (e) {
    logError(String(e))
  }
}

function startEditMeta() {
  if (!bank.value) return
  metaTitle.value = bank.value.title
  metaDesc.value = bank.value.description
  editingMeta.value = true
}

function cancelMeta() {
  if (isNew.value) {
    router.push('/banks')
  } else {
    editingMeta.value = false
    metaErrors.value = {}
  }
}

// ─── Question CRUD ────────────────────────────────────────────

function openNewQuestion() {
  editingQuestion.value = null
  showEditor.value = true
}

async function openEditQuestion(q: Question) {
  editingQuestion.value = q
  showEditor.value = true
  await nextTick()
  const idx = bank.value?.questions.findIndex((x) => x.id === q.id) ?? -1
  if (idx !== -1) {
    const el = document.getElementById(`editor-q-${idx}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
}

function onSaveQuestion(q: Question) {
  if (!bank.value) return
  const questions = [...bank.value.questions]
  const idx = questions.findIndex((x) => x.id === q.id)
  if (idx >= 0) {
    questions[idx] = q
    ok(`Updated question ${idx + 1}.`)
  } else {
    questions.push(q)
    ok(`Added question ${questions.length}.`)
  }
  const updated: QuestionBank = {
    ...bank.value,
    questions,
    updatedAt: new Date().toISOString(),
  }
  saveBank(updated)
  bank.value = updated
  showEditor.value = false
  editingQuestion.value = null
}

function confirmDeleteQuestion() {
  if (!bank.value || !deleteQuestionTarget.value) return
  const qid = deleteQuestionTarget.value.id
  const questions = bank.value.questions.filter((q) => q.id !== qid)
  const updated: QuestionBank = {
    ...bank.value,
    questions,
    updatedAt: new Date().toISOString(),
  }
  saveBank(updated)
  bank.value = updated
  ok('Question deleted.')
  deleteQuestionTarget.value = null
}

const optionLabels = ['A', 'B', 'C', 'D']
</script>

<template>
  <div class="detail-view" v-if="bank">

    <!-- Back + header -->
    <div class="detail-header">
      <button id="btn-back-to-banks" class="btn-back text-muted" @click="router.push('/banks')">
        ← banks
      </button>
      <div class="header-title">
        <template v-if="!editingMeta">
          <h1 class="bank-name">
            <span class="text-cyan" aria-hidden="true">▤</span>
            {{ bank.title || '(untitled)' }}
          </h1>
          <p v-if="bank.description" class="bank-desc text-muted">{{ bank.description }}</p>
        </template>
        <form v-else class="meta-form" @submit.prevent="saveMeta">
          <div class="meta-field" :class="{ error: metaErrors.title }">
            <label for="meta-title" class="meta-label text-dim">
              <span class="text-cyan">&gt;</span> bank title <span class="text-red">*</span>
            </label>
            <input id="meta-title" v-model="metaTitle" type="text" placeholder="Bank title…" :aria-invalid="!!metaErrors.title" />
            <span v-if="metaErrors.title" class="meta-error text-red" role="alert">{{ metaErrors.title }}</span>
          </div>
          <div class="meta-field">
            <label for="meta-desc" class="meta-label text-dim">
              <span class="text-cyan">&gt;</span> description (optional)
            </label>
            <input id="meta-desc" v-model="metaDesc" type="text" placeholder="Describe this bank…" />
          </div>
          <div class="meta-actions">
            <button type="button" class="btn btn-secondary" @click="cancelMeta">cancel</button>
            <button type="submit" id="btn-save-meta" class="btn btn-primary">save</button>
          </div>
        </form>
      </div>

      <div v-if="!editingMeta" class="header-actions">
        <div class="bank-meta-info text-dim">
          <span>{{ bank.questions.length }} questions</span>
          <span>·</span>
          <span>{{ formatTimestamp(bank.updatedAt) }}</span>
        </div>
        <button id="btn-edit-meta" class="btn btn-ghost" @click="startEditMeta">✎ edit info</button>
        <button
          id="btn-start-practice"
          class="btn btn-primary"
          :disabled="bank.questions.length === 0"
          @click="router.push(`/practice/${bank.id}`)"
        >
          ▶ practice
        </button>
      </div>
    </div>

    <!-- Questions section -->
    <div class="questions-section">
      <div class="section-toolbar">
        <div class="section-title text-dim">
          <span class="text-cyan">//</span>
          questions ({{ bank.questions.length }})
        </div>
        <button
          id="btn-add-question"
          class="btn btn-primary"
          @click="openNewQuestion"
          :disabled="showEditor"
        >
          + add question
        </button>
      </div>

      <!-- New question editor -->
      <div v-if="showEditor && !editingQuestion" class="editor-panel new-question-editor">
        <QuestionEditor
          :question="null"
          @save="onSaveQuestion"
          @cancel="showEditor = false; editingQuestion = null"
        />
      </div>

      <!-- Empty questions -->
      <div v-if="bank.questions.length === 0 && !showEditor" class="empty-questions">
        <span class="text-dim">No questions yet. Click "+ add question" to create the first one.</span>
      </div>

      <!-- Question list -->
      <div class="question-list" role="list" aria-label="Questions in this bank">
        <template v-for="(q, i) in bank.questions" :key="q.id">
          <!-- Inline editor for this question -->
          <div
            v-if="showEditor && editingQuestion?.id === q.id"
            :id="`editor-q-${i}`"
            class="editor-panel inline-editor"
          >
            <QuestionEditor
              :question="editingQuestion"
              @save="onSaveQuestion"
              @cancel="showEditor = false; editingQuestion = null"
            />
          </div>

          <!-- Question card when not editing -->
          <div
            v-else
            class="question-card"
            role="listitem"
          >
            <div class="question-card-num text-dim">{{ i + 1 }}</div>
            <div class="question-card-content">
              <p class="question-card-text">{{ q.text }}</p>
              <div class="question-card-options">
                <span
                  v-for="(opt, j) in q.options"
                  :key="opt.id"
                  class="option-chip"
                  :class="{ correct: opt.id === q.correctOptionId }"
                >
                  <span class="chip-letter">{{ optionLabels[j] }}</span>
                  {{ opt.text }}
                </span>
              </div>
              <div v-if="q.explanation" class="question-card-explanation text-dim">
                <span class="text-cyan">Exp:</span> {{ q.explanation }}
              </div>
            </div>
            <div class="question-card-actions">
              <button :id="`btn-edit-q-${i}`" class="btn btn-ghost" @click="openEditQuestion(q)">✎ edit</button>
              <button :id="`btn-del-q-${i}`" class="btn btn-ghost btn-danger-ghost" @click="deleteQuestionTarget = q">✕</button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Delete question confirm -->
    <ConfirmDialog
      v-if="deleteQuestionTarget"
      title="Delete Question"
      :message="`Delete this question? &quot;${deleteQuestionTarget.text.slice(0, 80)}&quot;`"
      confirm-label="Delete"
      :danger="true"
      @confirm="confirmDeleteQuestion"
      @cancel="deleteQuestionTarget = null"
    />
  </div>
</template>

<style scoped>
.detail-view {
  padding: var(--space-6) var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.btn-back {
  background: none;
  border: none;
  font-family: var(--font-mono);
  font-size: 12.5px;
  cursor: pointer;
  transition: color var(--transition-fast);
  padding: 0;
  align-self: flex-start;
}
.btn-back:hover { color: var(--ansi-cyan); }

/* Header */
.detail-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.header-title { display: flex; flex-direction: column; gap: var(--space-2); }

.bank-name {
  font-size: 20px;
  font-weight: 700;
  font-family: var(--font-mono);
  display: flex;
  gap: var(--space-2);
  align-items: center;
  color: var(--color-text);
}

.bank-desc { font-size: 13px; }

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.bank-meta-info { font-size: 12.5px; display: flex; gap: var(--space-2); flex: 1; }

/* Meta form */
.meta-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  background: var(--bg-panel);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  padding: var(--space-5);
}
.meta-field { display: flex; flex-direction: column; gap: var(--space-2); }
.meta-label { font-size: 12.5px; }
.meta-error { font-size: 12.5px; }
.meta-actions { display: flex; gap: var(--space-3); justify-content: flex-end; }

/* Editor panel */
.editor-panel {
  border-radius: var(--radius-md);
  animation: slideDown 200ms ease;
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Questions */
.questions-section { display: flex; flex-direction: column; gap: var(--space-4); }

.section-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.section-title {
  font-size: 12.5px;
  letter-spacing: 1px;
  display: flex;
  gap: var(--space-2);
}

.empty-questions {
  padding: var(--space-6);
  border: 1px dashed var(--border-dim);
  border-radius: var(--radius-sm);
  text-align: center;
  font-size: 13px;
}

.question-list { display: flex; flex-direction: column; gap: var(--space-3); }

.question-card {
  background: var(--bg-panel);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  display: flex;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  transition: border-color var(--transition-fast);
}
.question-card:hover { border-color: var(--border-bright); }

.question-card-num {
  font-size: 12.5px;
  min-width: 24px;
  padding-top: 2px;
}

.question-card-content { flex: 1; display: flex; flex-direction: column; gap: var(--space-2); }

.question-card-text {
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text);
}

.question-card-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.option-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  padding: 2px 8px;
  background: var(--bg-input);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  color: var(--color-muted);
}
.option-chip.correct {
  border-color: var(--ansi-green);
  color: var(--ansi-green);
  background: rgba(80,250,123,0.08);
}
.chip-letter {
  font-weight: 700;
  font-size: 12.5px;
}

.question-card-explanation {
  font-size: 12.5px;
  line-height: 1.5;
  border-top: 1px solid var(--border-dim);
  padding-top: var(--space-2);
}

.question-card-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: flex-end;
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
.btn-primary { background: var(--ansi-cyan); color: #000; border-color: var(--ansi-cyan); }
.btn-primary:hover:not(:disabled) { background: #a0f0ff; }
.btn-secondary { background: transparent; color: var(--color-muted); border-color: var(--border-normal); }
.btn-secondary:hover { color: var(--color-text); border-color: var(--border-bright); }
.btn-ghost { background: transparent; color: var(--color-dim); border-color: transparent; }
.btn-ghost:hover { color: var(--color-muted); border-color: var(--border-dim); }
.btn-danger-ghost:hover { color: var(--ansi-red) !important; border-color: var(--ansi-red) !important; }
</style>
