/**
 * quizEngine.ts
 *
 * Pure quiz session logic — completely independent of Vue and the UI.
 * The engine never mutates the original question bank data.
 */

import type { QuestionBank, Question, AnswerOption, QuizSession, QuestionAttempt } from '../types'
import { shuffled } from '../utils/shuffle'
import { generateId } from '../utils/helpers'

// ─── Session State (in-memory) ────────────────────────────────────────────────

export interface ActiveSession {
  session: QuizSession
  /** Shuffled list of questions for this session */
  questions: Question[]
  /** Per-question shuffled options (parallel to questions array) */
  shuffledOptions: AnswerOption[][]
  currentIndex: number
  startedAt: number   // Date.now()
  questionStartedAt: number  // Date.now() for current question
  /** Selected option ID for the current question (before submission) */
  pendingSelection: string | null
  /** Whether the current question has been submitted */
  submitted: boolean
  complete: boolean
}

/** Creates a new session and randomizes questions + options. */
export function createSession(bank: QuestionBank): ActiveSession {
  const questions = shuffled(bank.questions)
  const shuffledOptions = questions.map((q) => shuffled(q.options))

  const session: QuizSession = {
    id: generateId('session'),
    bankId: bank.id,
    bankTitle: bank.title,
    startedAt: new Date().toISOString(),
    completedAt: null,
    totalQuestions: questions.length,
    attempts: [],
    questionSnapshots: [...bank.questions],  // full snapshot for review integrity
  }

  return {
    session,
    questions,
    shuffledOptions,
    currentIndex: 0,
    startedAt: Date.now(),
    questionStartedAt: Date.now(),
    pendingSelection: null,
    submitted: false,
    complete: false,
  }
}

/** Select an answer option (before submitting). */
export function selectOption(active: ActiveSession, optionId: string): ActiveSession {
  if (active.submitted || active.complete) return active
  return { ...active, pendingSelection: optionId }
}

/** Submit the current answer. Returns updated session. */
export function submitAnswer(active: ActiveSession): ActiveSession {
  if (active.submitted || active.complete || !active.pendingSelection) return active

  const question = active.questions[active.currentIndex]
  const isCorrect = active.pendingSelection === question.correctOptionId
  const timeTakenMs = Date.now() - active.questionStartedAt

  const attempt: QuestionAttempt = {
    questionId: question.id,
    selectedOptionId: active.pendingSelection,
    result: isCorrect ? 'correct' : 'incorrect',
    timeTakenMs,
  }

  return {
    ...active,
    submitted: true,
    session: {
      ...active.session,
      attempts: [...active.session.attempts, attempt],
    },
  }
}

/** Advance to the next question. Returns updated session (or marks as complete). */
export function advanceQuestion(active: ActiveSession): ActiveSession {
  if (!active.submitted) return active

  const nextIndex = active.currentIndex + 1
  const isComplete = nextIndex >= active.questions.length

  const completedAt = isComplete ? new Date().toISOString() : null

  return {
    ...active,
    currentIndex: isComplete ? active.currentIndex : nextIndex,
    submitted: false,
    pendingSelection: null,
    questionStartedAt: Date.now(),
    complete: isComplete,
    session: {
      ...active.session,
      completedAt,
    },
  }
}

/** Get current question. */
export function currentQuestion(active: ActiveSession): Question | null {
  return active.questions[active.currentIndex] ?? null
}

/** Get shuffled options for the current question. */
export function currentOptions(active: ActiveSession): AnswerOption[] {
  return active.shuffledOptions[active.currentIndex] ?? []
}

/** Compute score summary from a completed session. */
export function computeScore(session: QuizSession): {
  correct: number
  incorrect: number
  accuracy: number
  durationMs: number
} {
  const correct = session.attempts.filter((a) => a.result === 'correct').length
  const incorrect = session.attempts.filter((a) => a.result === 'incorrect').length
  const accuracy = session.totalQuestions > 0 ? Math.round((correct / session.totalQuestions) * 100) : 0
  const durationMs = session.completedAt && session.startedAt
    ? new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()
    : 0

  return { correct, incorrect, accuracy, durationMs }
}

/** Get the original question object (from snapshot) given a question ID. */
export function getSnapshotQuestion(session: QuizSession, questionId: string): Question | null {
  return session.questionSnapshots.find((q) => q.id === questionId) ?? null
}
