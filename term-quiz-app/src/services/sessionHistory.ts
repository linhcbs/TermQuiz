/**
 * sessionHistory.ts
 *
 * Records and retrieves completed quiz session summaries in localStorage.
 *
 * We store only compact summaries (no full session data) to keep storage light.
 * If full review data is needed it should be passed through the router state.
 */

import type { SessionSummary, QuizSession } from '../types'
import { computeScore } from './quizEngine'

const HISTORY_KEY = 'termquiz_session_history'
const MAX_HISTORY_ENTRIES = 100

function readHistory(): SessionSummary[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeHistory(entries: SessionSummary[]): void {
  // Keep at most MAX_HISTORY_ENTRIES, newest first
  const trimmed = entries.slice(0, MAX_HISTORY_ENTRIES)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed))
}

/** Add a completed session to history. */
export function recordSession(session: QuizSession): void {
  if (!session.completedAt) return

  const score = computeScore(session)
  const summary: SessionSummary = {
    id: session.id,
    bankId: session.bankId,
    bankTitle: session.bankTitle,
    completedAt: session.completedAt,
    totalQuestions: session.totalQuestions,
    correctCount: score.correct,
    incorrectCount: score.incorrect,
    accuracyPct: score.accuracy,
    durationMs: score.durationMs,
  }

  const history = readHistory()
  // Newest first
  writeHistory([summary, ...history.filter((s) => s.id !== summary.id)])
}

/** Get all session summaries, newest first. */
export function getHistory(): SessionSummary[] {
  return readHistory()
}

/** Clear all history. */
export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY)
}

/** Remove history entries for a specific bank (called when bank is deleted). */
export function removeHistoryForBank(bankId: string): void {
  const history = readHistory().filter((s) => s.bankId !== bankId)
  writeHistory(history)
}
