<script setup lang="ts">
// QuizWorkspace — Active quiz session: question display, option selection, feedback
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { QuestionBank } from '../types'
import {
  createSession,
  selectOption,
  submitAnswer,
  advanceQuestion,
  currentQuestion,
  currentOptions,
  computeScore,
  type ActiveSession,
} from '../services/quizEngine'
import { useTerminalLog } from '../services/terminalLog'

const props = defineProps<{ bank: QuestionBank }>()
const emit = defineEmits<{
  complete: [session: import('../types').QuizSession]
  exit: []
}>()

const { info, ok, error: logError, quiz } = useTerminalLog()

// ─── Session state ─────────────────────────────────────────────

const active = ref<ActiveSession | null>(null)
// Cursor index for arrow-key navigation among options (-1 means no option is highlighted until interaction)
const cursorIdx = ref(-1)

function startSession() {
  active.value = createSession(props.bank)
  cursorIdx.value = -1
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
  quiz(`Session started. ${active.value.session.totalQuestions} questions loaded.`)
  info(`Bank: ${props.bank.title}`)
}

// ─── Derived ───────────────────────────────────────────────────

const question = computed(() => active.value ? currentQuestion(active.value) : null)
const options = computed(() => active.value ? currentOptions(active.value) : [])
const progress = computed(() => {
  if (!active.value) return 0
  return Math.round(((active.value.currentIndex) / active.value.session.totalQuestions) * 100)
})
const progressAfterSubmit = computed(() => {
  if (!active.value) return 0
  return Math.round(((active.value.currentIndex + 1) / active.value.session.totalQuestions) * 100)
})

// ASCII-art progress bar  e.g.  [======>       ] 45%
const progressBar = computed(() => {
  const pct = active.value?.submitted ? progressAfterSubmit.value : progress.value
  const W = 24
  const filled = Math.round((pct / 100) * W)
  const bar = '='.repeat(Math.max(0, filled - 1)) + (filled > 0 ? '>' : '') + ' '.repeat(W - filled)
  return `[${bar}] ${pct}%`
})

// ─── Actions ───────────────────────────────────────────────────

function select(optId: string) {
  if (!active.value || active.value.submitted) return
  active.value = selectOption(active.value, optId)
}

function submit() {
  if (!active.value || !active.value.pendingSelection || active.value.submitted) return

  active.value = submitAnswer(active.value)

  const q = question.value!
  const attempt = active.value.session.attempts.at(-1)!
  if (attempt.result === 'correct') {
    ok('Correct answer.')
  } else {
    const correctOpt = q.options.find((o) => o.id === q.correctOptionId)
    logError(`Incorrect. Correct answer: ${correctOpt?.text ?? '?'}`)
  }
}

function next() {
  if (!active.value?.submitted) return
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
  active.value = advanceQuestion(active.value)
  cursorIdx.value = -1

  if (active.value.complete) {
    const score = computeScore(active.value.session)
    quiz(`Session complete. Score: ${score.correct}/${active.value.session.totalQuestions} (${score.accuracy}%)`)
    emit('complete', active.value.session)
  }
}

// ─── Keyboard shortcuts ────────────────────────────────────────

function onKeydown(e: KeyboardEvent) {
  // Don't intercept when user types in inputs or form controls
  if (
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLTextAreaElement ||
    e.target instanceof HTMLSelectElement ||
    (e.target as HTMLElement)?.isContentEditable
  ) {
    return
  }

  const session = active.value
  if (!session) return

  // ArrowUp / ArrowDown — move cursor between options (pre-submit only)
  if (!session.submitted) {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      e.stopPropagation()
      cursorIdx.value = cursorIdx.value === -1
        ? options.value.length - 1
        : (cursorIdx.value - 1 + options.value.length) % options.value.length
      select(options.value[cursorIdx.value].id)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      e.stopPropagation()
      cursorIdx.value = cursorIdx.value === -1
        ? 0
        : (cursorIdx.value + 1) % options.value.length
      select(options.value[cursorIdx.value].id)
      return
    }
    // Space — select the option currently under cursor
    if (e.key === ' ') {
      e.preventDefault()
      if (cursorIdx.value >= 0 && cursorIdx.value < options.value.length) {
        select(options.value[cursorIdx.value].id)
      }
      return
    }
  }

  // Escape or X: exit session
  if (e.key === 'Escape' || e.key.toLowerCase() === 'x' || e.code === 'KeyX') {
    e.preventDefault()
    emit('exit')
    return
  }

  let selectedIdx = -1

  // 1–4 keys: standard number row, numpad, or event codes
  if (e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1') selectedIdx = 0
  else if (e.key === '2' || e.code === 'Digit2' || e.code === 'Numpad2') selectedIdx = 1
  else if (e.key === '3' || e.code === 'Digit3' || e.code === 'Numpad3') selectedIdx = 2
  else if (e.key === '4' || e.code === 'Digit4' || e.code === 'Numpad4') selectedIdx = 3
  // A–D keys: letters or key codes
  else if (e.key.toLowerCase() === 'a' || e.code === 'KeyA') selectedIdx = 0
  else if (e.key.toLowerCase() === 'b' || e.code === 'KeyB') selectedIdx = 1
  else if (e.key.toLowerCase() === 'c' || e.code === 'KeyC') selectedIdx = 2
  else if (e.key.toLowerCase() === 'd' || e.code === 'KeyD') selectedIdx = 3

  if (selectedIdx !== -1) {
    if (selectedIdx < options.value.length && !session.submitted) {
      e.preventDefault()
      cursorIdx.value = selectedIdx
      select(options.value[selectedIdx].id)
    }
    return
  }

  // Enter: submit or advance
  if (e.key === 'Enter') {
    e.preventDefault()
    if (!session.submitted) submit()
    else next()
  }
}

onMounted(() => {
  startSession()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})

// ─── Helpers ───────────────────────────────────────────────────

const optionLetters = ['A', 'B', 'C', 'D']

function optionState(optId: string) {
  const session = active.value
  if (!session?.submitted) {
    return session?.pendingSelection === optId ? 'selected' : 'default'
  }
  const q = question.value!
  if (optId === q.correctOptionId) return 'correct'
  if (optId === session.pendingSelection) return 'incorrect'
  return 'default'
}

function optionAriaLabel(optId: string, text: string, index: number): string {
  const state = optionState(optId)
  const stateDesc = state === 'correct' ? ' (correct)' : state === 'incorrect' ? ' (incorrect)' : ''
  return `Option ${index + 1} (${optionLetters[index]}): ${text}${stateDesc}`
}

// Returns the ASCII glyph prefix for each option row
function optionGlyph(optId: string, _index?: number): string {
  const session = active.value
  if (!session) return '   '
  if (session.submitted) {
    const state = optionState(optId)
    if (state === 'correct')   return '[+]'
    if (state === 'incorrect') return '[x]'
    return '   '
  }
  const isSelected = session.pendingSelection === optId
  if (isSelected) return '[*]'
  return '   '
}
</script>

<template>
  <div v-if="active && question" class="quiz-workspace">

    <!-- Header line -->
    <div class="quiz-header">
      <span class="text-cyan hdr-q">Q{{ active.currentIndex + 1 }}/{{ active.session.totalQuestions }}</span>
      <span class="text-dim hdr-sep">|</span>
      <span class="text-dim hdr-bank-title">{{ active.session.bankTitle }}</span>
      <span class="text-dim hdr-sep">|</span>
      <span class="text-dim hdr-correct-count">{{ active.session.attempts.filter(a => a.result === 'correct').length }} correct</span>
      <span class="hdr-flex"></span>
      <button id="quiz-exit" class="btn-exit text-dim" @click="emit('exit')" title="Exit session (x or Esc)">[x exit]</button>
    </div>

    <!-- ASCII progress bar -->
    <div class="progress-line" aria-label="Quiz progress" role="progressbar"
         :aria-valuenow="active.submitted ? progressAfterSubmit : progress"
         aria-valuemin="0" aria-valuemax="100">
      <span class="text-dim">{{ progressBar }}</span>
    </div>

    <!-- Section divider -->
    <div class="ascii-rule text-dim">------------------------------------------------------------</div>

    <!-- Question body -->
    <div class="question-body">

      <!-- Question text -->
      <div class="question-prompt">
        <span class="prompt-symbol text-green" aria-hidden="true">&gt;&gt;</span>
        <p class="question-text" role="heading" aria-level="2">{{ question.text }}</p>
      </div>

      <!-- Optional image -->
      <div v-if="question.image" class="question-image">
        <img :src="question.image" alt="Question image" />
      </div>

      <!-- Answer options — CLI style, plain rows -->
      <div class="options-list" role="radiogroup"
           :aria-label="`Answer options for question ${active.currentIndex + 1}`">
        <button
          v-for="(opt, i) in options"
          :key="opt.id"
          :id="`option-${i}`"
          class="option-row"
          :class="{
            'opt-cursor':   !active.submitted && i === cursorIdx,
            'opt-selected': optionState(opt.id) === 'selected',
            'opt-correct':  optionState(opt.id) === 'correct',
            'opt-incorrect':optionState(opt.id) === 'incorrect',
          }"
          :disabled="active.submitted"
          :aria-pressed="active.pendingSelection === opt.id"
          :aria-label="optionAriaLabel(opt.id, opt.text, i)"
          @click="() => { if (!active!.submitted) { cursorIdx = i; select(opt.id) } }"
        >
          <span class="opt-glyph" aria-hidden="true">{{ optionGlyph(opt.id, i) }}</span>
          <span class="opt-label" aria-hidden="true"
                :title="`Press ${i + 1} or ${optionLetters[i]}`">{{ optionLetters[i] }}.</span>
          <span class="opt-text">{{ opt.text }}</span>
        </button>
      </div>
    </div>

    <!-- Section divider -->
    <div class="ascii-rule text-dim">------------------------------------------------------------</div>

    <!-- Feedback (shown after submit) -->
    <div v-if="active.submitted" class="feedback-area" role="status" aria-live="polite">
      <div class="feedback-result"
           :class="active.session.attempts.at(-1)?.result === 'correct' ? 'result-correct' : 'result-incorrect'">
        <span class="feedback-icon" aria-hidden="true">
          {{ active.session.attempts.at(-1)?.result === 'correct' ? '[+]' : '[x]' }}
        </span>
        <span class="feedback-label">
          {{ active.session.attempts.at(-1)?.result === 'correct' ? 'Correct!' : 'Incorrect' }}
        </span>
        <span v-if="active.session.attempts.at(-1)?.result === 'incorrect'" class="feedback-correct-label">
          &nbsp;-- correct: <strong>{{ options.find(o => o.id === question?.correctOptionId)?.text }}</strong>
        </span>
      </div>

      <div v-if="question?.explanation" class="explanation">
        <span class="explanation-label text-cyan">// </span> 
        <span class="explanation-text">{{ question?.explanation }}</span>
      </div>
    </div>

    <!-- Action bar -->
    <div class="quiz-actions">
      <div class="keyboard-hints text-dim">
        <span><span class="text-cyan">1–4</span>/<span class="text-cyan">A–D</span> select</span>
        <span> · </span>
        <span><span class="text-cyan">↑↓</span> navigate</span>
        <span> · </span>
        <span><span class="text-cyan">Space</span> toggle</span>
        <span> · </span>
        <span><span class="text-cyan">Enter</span> {{ active.submitted ? 'continue' : 'confirm' }}</span>
      </div>

      <div class="action-buttons">
        <button
          v-if="!active.submitted"
          id="btn-submit-answer"
          class="btn-cli"
          :disabled="!active.pendingSelection"
          @click="submit"
        >
          [submit]
        </button>
        <button
          v-else
          id="btn-next-question"
          class="btn-cli btn-cli-active"
          @click="next"
        >
          {{ active.currentIndex + 1 < active.session.totalQuestions ? '[next >>]' : '[results >>]' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quiz-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  font-family: var(--font-mono);
}

/* ── Header ────────────────────────────────────────────────── */
.quiz-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-6);
  flex-shrink: 0;
  font-size: 13px;
}
.hdr-q   { font-weight: 700; }
.hdr-sep { opacity: 0.35; margin: 0 2px; }
.hdr-flex { flex: 1; }

.btn-exit {
  background: none;
  border: none;
  font-family: var(--font-mono);
  font-size: 12.5px;
  padding: 0;
  cursor: pointer;
  color: var(--color-dim);
  transition: color var(--transition-fast);
}
.btn-exit:hover { color: var(--ansi-red); }

/* ── Progress ──────────────────────────────────────────────── */
.progress-line {
  padding: 0 var(--space-6) var(--space-1);
  font-size: 12.5px;
  letter-spacing: -0.3px;
  flex-shrink: 0;
}

/* ── ASCII rule ────────────────────────────────────────────── */
.ascii-rule {
  font-size: 12.5px;
  padding: 0 var(--space-6);
  flex-shrink: 0;
  opacity: 0.25;
  overflow: hidden;
  white-space: nowrap;
}

/* ── Question body ─────────────────────────────────────────── */
.question-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.question-prompt {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
}

.prompt-symbol {
  font-size: 13px;
  flex-shrink: 0;
  margin-top: 3px;
  letter-spacing: -2px;
}

.question-text {
  font-family: var(--font-mono);
  font-size: 15px;
  line-height: 1.75;
  color: var(--color-text);
}

.question-image img {
  max-width: 100%;
  max-height: 300px;
}

/* ── Option rows ───────────────────────────────────────────── */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.option-row {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  padding: 5px 6px;
  background: none;
  border: none;
  border-left: 2px solid transparent;
  outline: none;
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--color-muted);
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}

.option-row:focus,
.option-row:focus-visible {
  outline: none;
}

/* Cursor highlight: only a left accent, no background */
.option-row.opt-cursor {
  border-left-color: var(--ansi-cyan);
  color: var(--color-text);
}

.option-row:not(:disabled):hover {
  color: var(--color-text);
}

/* States */
.option-row.opt-selected  { color: var(--ansi-cyan); }
.option-row.opt-correct   { color: var(--ansi-green); }
.option-row.opt-incorrect { color: var(--ansi-red); }

.option-row:disabled { cursor: default; }

.opt-glyph {
  font-size: 13px;
  font-weight: 700;
  min-width: 3ch;
  flex-shrink: 0;
}

.opt-label {
  font-weight: 700;
  min-width: 2.2ch;
  flex-shrink: 0;
}

.opt-text {
  flex: 1;
  line-height: 1.5;
}

/* ── Feedback ──────────────────────────────────────────────── */
.feedback-area {
  padding: var(--space-3) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex-shrink: 0;
  animation: feedbackIn 150ms ease;
}

@keyframes feedbackIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.feedback-result {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  font-size: 14px;
  font-weight: 700;
}

.result-correct   { color: var(--ansi-green); }
.result-incorrect { color: var(--ansi-red);   }

.feedback-correct-label {
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 400;
}
.feedback-correct-label strong { color: var(--ansi-green); font-weight: 700; }

.explanation {
  display: flex;
  gap: 0;
  font-size: 13px;
  line-height: 1.6;
}
.explanation-label { flex-shrink: 0; }
.explanation-text  { color: var(--color-text); margin-left: 5px;}

/* ── Action bar ────────────────────────────────────────────── */
.quiz-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-6);
  flex-shrink: 0;
  font-size: 12.5px;
}

.keyboard-hints { color: var(--color-dim); }

.action-buttons { display: flex; gap: var(--space-3); }

.btn-cli {
  font-family: var(--font-mono);
  font-size: 13px;
  padding: 2px 10px;
  background: none;
  border: 1px solid var(--border-normal);
  color: var(--color-muted);
  cursor: pointer;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}
.btn-cli:hover:not(:disabled) {
  color: var(--ansi-cyan);
  border-color: var(--ansi-cyan);
}
.btn-cli-active {
  color: var(--ansi-green);
  border-color: var(--ansi-green);
}
.btn-cli-active:hover:not(:disabled) {
  opacity: 0.8;
}
.btn-cli:disabled {
  opacity: 0.3;
  cursor: default;
}

/* ── Responsive adjustments for mobile ──────────────────────── */
@media (max-width: 640px) {
  /* Hide keyboard hints on mobile devices */
  .keyboard-hints {
    display: none !important;
  }

  .quiz-header {
    padding: var(--space-2) var(--space-3);
    font-size: 11.5px;
    gap: var(--space-2);
  }

  .hdr-bank-title {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .progress-line {
    padding: 0 var(--space-3) var(--space-1);
    font-size: 11px;
    overflow-x: hidden;
    white-space: nowrap;
  }

  .ascii-rule {
    padding: 0 var(--space-3);
    font-size: 10.5px;
  }

  .question-body {
    padding: var(--space-3) var(--space-3);
    gap: var(--space-3);
  }

  .question-prompt {
    gap: var(--space-2);
  }

  .prompt-symbol {
    font-size: 12px;
    margin-top: 2px;
  }

  /* Smaller question text on mobile */
  .question-text {
    font-size: 13.5px;
    line-height: 1.55;
  }

  .options-list {
    gap: 3px;
  }

  /* Smaller option text on mobile with comfortable touch target */
  .option-row {
    font-size: 12.5px;
    padding: 7px 6px;
    min-height: 36px;
    gap: var(--space-2);
  }

  .opt-glyph {
    font-size: 11.5px;
    min-width: 2.6ch;
  }

  .opt-label {
    font-size: 12px;
    min-width: 2ch;
  }

  .feedback-area {
    padding: var(--space-2) var(--space-3);
    gap: var(--space-1);
  }

  .feedback-result {
    font-size: 12.5px;
    flex-wrap: wrap;
  }

  .feedback-correct-label {
    font-size: 12px;
  }

  .explanation {
    font-size: 12px;
    line-height: 1.5;
  }

  .quiz-actions {
    padding: var(--space-2) var(--space-3);
    justify-content: flex-end;
  }

  .action-buttons {
    width: 100%;
    justify-content: flex-end;
  }

  .btn-cli {
    padding: 5px 14px;
    font-size: 12.5px;
  }
}

@media (max-width: 420px) {
  .hdr-bank-title {
    max-width: 85px;
  }

  .question-text {
    font-size: 13px;
    line-height: 1.5;
  }

  .option-row {
    font-size: 12px;
  }
}
</style>

