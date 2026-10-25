// TermQuiz Core Types
// JSON schema version — increment when format changes in a breaking way
export const SCHEMA_VERSION = 1

// ─── Question Bank ───────────────────────────────────────────────────────────

export interface AnswerOption {
  id: string
  text: string
}

export interface Question {
  id: string
  type: 'multiple-choice'
  text: string
  /** Base64 data URL or null */
  image: string | null
  options: [AnswerOption, AnswerOption, AnswerOption, AnswerOption]
  /** Must reference one of the option IDs above */
  correctOptionId: string
  explanation: string | null
}

export interface QuestionBank {
  schemaVersion: typeof SCHEMA_VERSION
  id: string
  title: string
  description: string
  createdAt: string   // ISO 8601
  updatedAt: string   // ISO 8601
  questions: Question[]
}

// ─── Quiz Session ────────────────────────────────────────────────────────────

export type AnswerResult = 'correct' | 'incorrect'

export interface QuestionAttempt {
  questionId: string
  selectedOptionId: string
  result: AnswerResult
  /** Milliseconds taken to answer */
  timeTakenMs: number
}

export interface QuizSession {
  id: string
  bankId: string
  bankTitle: string
  startedAt: string
  completedAt: string | null
  totalQuestions: number
  attempts: QuestionAttempt[]
  /** Snapshot of questions so review is stable even after bank edits */
  questionSnapshots: Question[]
}

// ─── Session History ─────────────────────────────────────────────────────────

export interface SessionSummary {
  id: string
  bankId: string
  bankTitle: string
  completedAt: string
  totalQuestions: number
  correctCount: number
  incorrectCount: number
  accuracyPct: number
  durationMs: number
}

// ─── Terminal Log ────────────────────────────────────────────────────────────

export type LogLevel = 'info' | 'ok' | 'warn' | 'error' | 'quiz' | 'debug'

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  message: string
}

// ─── App Settings ────────────────────────────────────────────────────────────

export interface AppSettings {
  animationsEnabled: boolean
  immediateFeeback: boolean   // feedback mode for quiz
  maxLogEntries: number
}

export const DEFAULT_SETTINGS: AppSettings = {
  animationsEnabled: true,
  immediateFeeback: true,
  maxLogEntries: 200,
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}
