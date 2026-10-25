<script setup lang="ts">
// QuestionEditor — Form for creating or editing a single question
import { ref, reactive, watch } from 'vue'
import type { Question, AnswerOption } from '../types'
import { validateQuestionForm, validateImageFile } from '../services/questionValidation'
import { generateId } from '../utils/helpers'

interface Props {
  /** Pass existing question to edit; omit for new question */
  question?: Question | null
}

const props = withDefaults(defineProps<Props>(), { question: null })

const emit = defineEmits<{
  save: [question: Question]
  cancel: []
}>()

// ─── Form state ───────────────────────────────────────────────

function makeDefaultOptions(): [AnswerOption, AnswerOption, AnswerOption, AnswerOption] {
  return [
    { id: generateId('opt'), text: '' },
    { id: generateId('opt'), text: '' },
    { id: generateId('opt'), text: '' },
    { id: generateId('opt'), text: '' },
  ]
}

const questionText = ref('')
const options = ref<[AnswerOption, AnswerOption, AnswerOption, AnswerOption]>(makeDefaultOptions())
const correctOptionId = ref('')
const explanation = ref('')
const imagePreview = ref<string | null>(null)

// Form errors
const formErrors = reactive<{
  text?: string
  options?: (string | undefined)[]
  correctOptionId?: string
  image?: string
}>({})

// Populate when editing
watch(
  () => props.question,
  (q) => {
    if (q) {
      questionText.value = q.text
      options.value = q.options.map((o) => ({ ...o })) as [AnswerOption, AnswerOption, AnswerOption, AnswerOption]
      correctOptionId.value = q.correctOptionId
      explanation.value = q.explanation ?? ''
      imagePreview.value = q.image ?? null
    } else {
      // reset
      questionText.value = ''
      options.value = makeDefaultOptions()
      correctOptionId.value = ''
      explanation.value = ''
      imagePreview.value = null
    }
    Object.keys(formErrors).forEach((k) => delete (formErrors as Record<string, unknown>)[k])
  },
  { immediate: true },
)

// ─── Image handling ───────────────────────────────────────────

const fileInputRef = ref<HTMLInputElement | null>(null)

function triggerFileInput() {
  fileInputRef.value?.click()
}

async function handleImageFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const error = validateImageFile(file)
  if (error) {
    formErrors.image = error
    return
  }

  delete formErrors.image

  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  // Reset file input so same file can be re-selected
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function removeImage() {
  imagePreview.value = null
  delete formErrors.image
}

// ─── Save ────────────────────────────────────────────────────

function save() {
  const errors = validateQuestionForm(
    questionText.value,
    options.value,
    correctOptionId.value,
    imagePreview.value,
  )

  // Write errors back to reactive object
  formErrors.text = errors.text
  formErrors.options = errors.options
  formErrors.correctOptionId = errors.correctOptionId
  // image errors are set separately

  const hasErrors = Object.values(formErrors).some((v) =>
    Array.isArray(v) ? v.some(Boolean) : Boolean(v),
  )
  if (hasErrors) return

  const question: Question = {
    id: props.question?.id ?? generateId('question'),
    type: 'multiple-choice',
    text: questionText.value.trim(),
    image: imagePreview.value,
    options: options.value.map((o) => ({ id: o.id, text: o.text.trim() })) as [AnswerOption, AnswerOption, AnswerOption, AnswerOption],
    correctOptionId: correctOptionId.value,
    explanation: explanation.value.trim() || null,
  }

  emit('save', question)
}

const optionLabels = ['A', 'B', 'C', 'D']
</script>

<template>
  <div class="editor">
    <div class="editor-header">
      <span class="text-cyan">$</span>
      <h2 class="editor-title">{{ props.question ? 'edit question' : 'new question' }}</h2>
    </div>

    <form class="editor-form" @submit.prevent="save" novalidate>

      <!-- Question Text -->
      <div class="field" :class="{ 'field-error': formErrors.text }">
        <label class="field-label" for="q-text">
          <span class="text-cyan">&gt;</span> question text <span class="text-red">*</span>
        </label>
        <textarea
          id="q-text"
          v-model="questionText"
          rows="4"
          placeholder="Enter the question..."
          :aria-invalid="!!formErrors.text"
          :aria-describedby="formErrors.text ? 'q-text-err' : undefined"
        ></textarea>
        <span v-if="formErrors.text" id="q-text-err" class="field-error-msg" role="alert">{{ formErrors.text }}</span>
      </div>

      <!-- Image -->
      <div class="field" :class="{ 'field-error': formErrors.image }">
        <label class="field-label">
          <span class="text-cyan">&gt;</span> image (optional)
        </label>
        <div class="image-area">
          <div v-if="imagePreview" class="image-preview">
            <img :src="imagePreview" alt="Question image preview" />
            <button type="button" class="btn-remove-image text-red" @click="removeImage" aria-label="Remove image">✕ remove</button>
          </div>
          <button v-else type="button" class="btn-upload" @click="triggerFileInput" id="btn-upload-image">
            <span class="text-muted">📎 choose image file (JPEG, PNG, WebP, GIF, SVG · max 2 MB)</span>
          </button>
          <input
            ref="fileInputRef"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
            class="sr-only"
            @change="handleImageFile"
            aria-label="Upload question image"
          />
        </div>
        <span v-if="formErrors.image" class="field-error-msg" role="alert">{{ formErrors.image }}</span>
      </div>

      <!-- Answer Options -->
      <fieldset class="field">
        <legend class="field-label">
          <span class="text-cyan">&gt;</span> answer options <span class="text-red">*</span>
        </legend>
        <div
          v-for="(opt, i) in options"
          :key="opt.id"
          class="option-row"
          :class="{
            'option-correct': correctOptionId === opt.id,
            'option-error': formErrors.options?.[i],
          }"
        >
          <button
            type="button"
            class="option-label-btn"
            :class="{ selected: correctOptionId === opt.id }"
            @click="correctOptionId = opt.id"
            :aria-pressed="correctOptionId === opt.id"
            :aria-label="`Mark option ${optionLabels[i]} as correct`"
            :id="`opt-correct-${i}`"
          >
            {{ optionLabels[i] }}
          </button>
          <div class="option-input-wrap">
            <input
              :id="`opt-text-${i}`"
              v-model="options[i].text"
              type="text"
              :placeholder="`Option ${optionLabels[i]}…`"
              :aria-label="`Option ${optionLabels[i]}`"
              :aria-invalid="!!formErrors.options?.[i]"
            />
            <span v-if="formErrors.options?.[i]" class="field-error-msg" role="alert">{{ formErrors.options[i] }}</span>
          </div>
          <span v-if="correctOptionId === opt.id" class="correct-badge text-green">✓ correct</span>
        </div>
        <span v-if="formErrors.correctOptionId" class="field-error-msg" role="alert">{{ formErrors.correctOptionId }}</span>
      </fieldset>

      <!-- Explanation -->
      <div class="field">
        <label class="field-label" for="q-explanation">
          <span class="text-cyan">&gt;</span> explanation (optional)
        </label>
        <textarea
          id="q-explanation"
          v-model="explanation"
          rows="2"
          placeholder="Explain why the answer is correct…"
        ></textarea>
      </div>

      <!-- Actions -->
      <div class="editor-actions">
        <button type="button" id="editor-cancel" class="btn btn-secondary" @click="emit('cancel')">
          cancel
        </button>
        <button type="submit" id="editor-save" class="btn btn-primary">
          {{ props.question ? 'update question' : 'add question' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.editor {
  background: var(--bg-panel);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
}

.editor-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--border-dim);
}

.editor-title {
  font-size: 14px;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--color-text);
}

.editor-form {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  border: none;
  padding: 0;
}

.field-label {
  font-size: 12.5px;
  color: var(--color-muted);
  letter-spacing: 0.5px;
}

.field-error input,
.field-error textarea {
  border-color: var(--ansi-red);
}

.field-error-msg {
  font-size: 12.5px;
  color: var(--ansi-red);
}

/* Image */
.image-area { display: flex; flex-direction: column; gap: var(--space-2); }

.image-preview {
  position: relative;
  display: inline-block;
}

.image-preview img {
  max-width: 100%;
  max-height: 200px;
  border: 1px solid var(--border-normal);
  border-radius: var(--radius-sm);
  display: block;
}

.btn-remove-image {
  background: none;
  border: 1px solid var(--ansi-red);
  font-family: var(--font-mono);
  font-size: 12.5px;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  margin-top: var(--space-2);
  cursor: pointer;
  transition: background var(--transition-fast);
}
.btn-remove-image:hover { background: rgba(255,85,85,0.1); }

.btn-upload {
  background: var(--bg-input);
  border: 1px dashed var(--border-normal);
  border-radius: var(--radius-sm);
  padding: var(--space-4);
  text-align: center;
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: var(--color-muted);
  width: 100%;
  transition: border-color var(--transition-fast), background var(--transition-fast);
}
.btn-upload:hover {
  border-color: var(--ansi-cyan);
  background: rgba(139,233,253,0.03);
}

/* Options */
.option-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  transition: border-color var(--transition-fast), background var(--transition-fast);
}

.option-correct {
  border-color: var(--ansi-green);
  background: rgba(80,250,123,0.04);
}

.option-error {
  border-color: var(--ansi-red);
}

.option-label-btn {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  background: var(--bg-input);
  border: 1px solid var(--border-normal);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--color-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.option-label-btn.selected {
  background: var(--ansi-green);
  border-color: var(--ansi-green);
  color: #000;
}
.option-label-btn:hover:not(.selected) {
  border-color: var(--ansi-green);
  color: var(--ansi-green);
}

.option-input-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.correct-badge {
  font-size: 12.5px;
  flex-shrink: 0;
  align-self: center;
  font-weight: 700;
}

/* Actions */
.editor-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  padding-top: var(--space-2);
  border-top: 1px solid var(--border-dim);
}

/* Shared button styles (duplicated from global for scoped component) */
.btn {
  font-family: var(--font-mono);
  font-size: 13px;
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
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
</style>
