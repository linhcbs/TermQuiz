<script setup lang="ts">
// QuizSummary — End-of-session results screen
import type { QuizSession } from '../types'
import { computeScore, getSnapshotQuestion } from '../services/quizEngine'
import { formatDuration } from '../utils/helpers'
import { computed, ref } from 'vue'

const props = defineProps<{
  session: QuizSession
}>()

const emit = defineEmits<{
  restart: []
  backToBanks: []
}>()

const score = computed(() => computeScore(props.session))

const incorrectAttempts = computed(() =>
  props.session.attempts.filter((a) => a.result === 'incorrect'),
)

const filter = ref<'incorrect' | 'all'>(
  props.session.attempts.some((a) => a.result === 'incorrect') ? 'incorrect' : 'all',
)

const displayedAttempts = computed(() => {
  if (filter.value === 'incorrect') return incorrectAttempts.value
  return props.session.attempts
})

function getQuestion(questionId: string) {
  return getSnapshotQuestion(props.session, questionId)
}

function getOptionText(questionId: string, optionId: string): string {
  const q = getQuestion(questionId)
  return q?.options.find((o) => o.id === optionId)?.text ?? '?'
}

function accuracyClass(pct: number): string {
  if (pct >= 80) return 'text-green'
  if (pct >= 50) return 'text-yellow'
  return 'text-red'
}
</script>

<template>
  <div class="summary">

    <!-- Header -->
    <div class="summary-header">
      <span class="text-green header-icon" aria-hidden="true">■</span>
      <h1 class="summary-title">Session Complete</h1>
    </div>

    <!-- Score card -->
    <div class="score-card" role="region" aria-label="Session results">
      <div class="score-grid">
        <div class="score-item">
          <span class="score-value" :class="accuracyClass(score.accuracy)">{{ score.accuracy }}%</span>
          <span class="score-label text-dim">accuracy</span>
        </div>
        <div class="score-item">
          <span class="score-value text-green">{{ score.correct }}</span>
          <span class="score-label text-dim">correct</span>
        </div>
        <div class="score-item">
          <span class="score-value text-red">{{ score.incorrect }}</span>
          <span class="score-label text-dim">incorrect</span>
        </div>
        <div class="score-item">
          <span class="score-value text-cyan">{{ session.totalQuestions }}</span>
          <span class="score-label text-dim">total</span>
        </div>
        <div v-if="score.durationMs > 0" class="score-item">
          <span class="score-value text-muted">{{ formatDuration(score.durationMs) }}</span>
          <span class="score-label text-dim">duration</span>
        </div>
      </div>

      <!-- Progress visual -->
      <div class="result-bar" role="img" :aria-label="`${score.accuracy}% accuracy`">
        <div
          class="result-bar-fill"
          :style="{ width: score.accuracy + '%' }"
          :class="accuracyClass(score.accuracy)"
        ></div>
      </div>

      <div class="bank-info text-dim">
        <span>Bank: </span><span>{{ session.bankTitle }}</span>
      </div>
    </div>

    <!-- Questions review section -->
    <div class="incorrect-section" role="region" aria-label="Review questions and answers">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-3); margin-bottom: var(--space-4);">
        <h2 class="section-title" style="margin-bottom: 0;">
          <span class="text-cyan">//</span>
          Review ({{ displayedAttempts.length }})
        </h2>
        <div style="display: flex; gap: var(--space-2);">
          <button
            id="tab-review-incorrect"
            class="btn btn-secondary"
            :style="filter === 'incorrect' ? 'border-color: var(--ansi-yellow); color: var(--ansi-yellow);' : ''"
            @click="filter = 'incorrect'"
          >
            Incorrect Only ({{ incorrectAttempts.length }})
          </button>
          <button
            id="tab-review-all"
            class="btn btn-secondary"
            :style="filter === 'all' ? 'border-color: var(--ansi-cyan); color: var(--ansi-cyan);' : ''"
            @click="filter = 'all'"
          >
            All Questions ({{ session.attempts.length }})
          </button>
        </div>
      </div>

      <div v-if="displayedAttempts.length > 0" class="incorrect-list">
        <div
          v-for="attempt in displayedAttempts"
          :key="attempt.questionId"
          class="incorrect-item"
          :style="attempt.result === 'correct' ? 'border-color: rgba(80, 250, 123, 0.3);' : ''"
        >
          <div class="incorrect-question">
            <span :class="attempt.result === 'correct' ? 'text-green' : 'text-red'" class="question-prefix">
              {{ attempt.result === 'correct' ? '✓' : '✗' }}
            </span>
            <p class="question-text">{{ getQuestion(attempt.questionId)?.text }}</p>
          </div>

          <div class="answer-comparison">
            <div class="answer-row" :class="attempt.result === 'correct' ? 'answer-right' : 'answer-wrong'">
              <span class="answer-badge" :class="attempt.result === 'correct' ? 'text-green' : 'text-red'">Your answer:</span>
              <span :class="attempt.result === 'correct' ? 'text-green' : ''">{{ getOptionText(attempt.questionId, attempt.selectedOptionId) }}</span>
            </div>
            <div v-if="attempt.result === 'incorrect'" class="answer-row answer-right">
              <span class="answer-badge text-green">Correct answer:</span>
              <span class="text-green">{{ getOptionText(attempt.questionId, getQuestion(attempt.questionId)?.correctOptionId ?? '') }}</span>
            </div>
          </div>

          <div v-if="getQuestion(attempt.questionId)?.explanation" class="incorrect-explanation">
            <span class="text-cyan">Explanation: </span>
            <span class="text-muted">{{ getQuestion(attempt.questionId)?.explanation }}</span>
          </div>
        </div>
      </div>

      <div v-else class="all-correct" role="status">
        <span class="text-green" aria-hidden="true">★</span>
        No incorrect answers in this session!
      </div>
    </div>

    <!-- Actions -->
    <div class="summary-actions">
      <button id="btn-back-to-banks" class="btn btn-secondary" @click="emit('backToBanks')">
        ← back to banks
      </button>
      <button id="btn-restart-session" class="btn btn-primary" @click="emit('restart')">
        ↻ practice again
      </button>
    </div>
  </div>
</template>

<style scoped>
.summary {
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  max-width: 800px;
  margin: 0 auto;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.header-icon { font-size: 18px; }

.summary-title {
  font-family: var(--font-mono);
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
}

/* Score card */
.score-card {
  background: var(--bg-panel);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.score-grid {
  display: flex;
  gap: var(--space-8);
  flex-wrap: wrap;
}

.score-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.score-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
}

.score-label {
  font-size: 12.5px;
  letter-spacing: 1px;
}

.result-bar {
  height: 6px;
  background: var(--bg-input);
  border-radius: 3px;
  overflow: hidden;
}

.result-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width var(--transition-slow);
  background: currentColor;
}

.bank-info { font-size: 12.5px; }

/* Incorrect section */
.section-title {
  font-size: 14px;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.incorrect-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.incorrect-item {
  background: var(--bg-panel);
  border: 1px solid var(--border-dim);
  border-left: 3px solid var(--ansi-red);
  border-radius: var(--radius-sm);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.incorrect-question {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
}

.question-prefix {
  font-size: 12.5px;
  flex-shrink: 0;
  margin-top: 2px;
}

.question-text {
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text);
}

.answer-comparison {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: 13px;
}

.answer-row {
  display: flex;
  gap: var(--space-3);
  align-items: baseline;
}

.answer-badge {
  font-size: 12.5px;
  font-weight: 700;
  min-width: 90px;
  flex-shrink: 0;
}

.incorrect-explanation {
  font-size: 12.5px;
  line-height: 1.6;
  border-top: 1px solid var(--border-dim);
  padding-top: var(--space-3);
}

/* All correct */
.all-correct {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--ansi-green);
  font-size: 16px;
  font-weight: 700;
  padding: var(--space-6);
  background: rgba(80,250,123,0.05);
  border: 1px solid var(--ansi-green);
  border-radius: var(--radius-md);
}

/* Actions */
.summary-actions {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.btn {
  font-family: var(--font-mono);
  font-size: 13px;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
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
