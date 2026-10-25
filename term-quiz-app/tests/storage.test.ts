import { describe, it, expect, beforeEach } from 'vitest'

// Setup in-memory localStorage mock for node environment
const storageStore = new Map<string, string>()
const mockLocalStorage = {
  getItem: (key: string) => storageStore.get(key) ?? null,
  setItem: (key: string, val: string) => { storageStore.set(key, String(val)) },
  removeItem: (key: string) => { storageStore.delete(key) },
  clear: () => { storageStore.clear() },
  get length() { return storageStore.size },
  key: (index: number) => Array.from(storageStore.keys())[index] ?? null,
}

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

import {
  listBanks,
  getBank,
  saveBank,
  deleteBank,
  bankExists,
  isStorageAvailable,
} from '../src/services/bankStorage'
import {
  getHistory,
  recordSession,
  clearHistory,
  removeHistoryForBank,
} from '../src/services/sessionHistory'
import type { QuestionBank, QuizSession } from '../src/types'

describe('bankStorage service', () => {
  beforeEach(() => {
    storageStore.clear()
  })

  it('detects storage availability', () => {
    expect(isStorageAvailable()).toBe(true)
  })

  it('starts with empty bank list on fresh storage', () => {
    const banks = listBanks()
    expect(banks).toHaveLength(0)
  })

  it('saves and retrieves a new custom bank', () => {
    const customBank: QuestionBank = {
      schemaVersion: 1,
      id: 'custom_bank_123',
      title: 'Docker & Containers',
      description: 'Practice questions for Docker',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: [],
    }

    saveBank(customBank)
    expect(bankExists('custom_bank_123')).toBe(true)

    const retrieved = getBank('custom_bank_123')
    expect(retrieved).not.toBeNull()
    expect(retrieved?.title).toBe('Docker & Containers')
  })

  it('deletes an existing bank', () => {
    const customBank: QuestionBank = {
      schemaVersion: 1,
      id: 'bank_to_delete',
      title: 'Temporary Bank',
      description: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: [],
    }

    saveBank(customBank)
    expect(bankExists('bank_to_delete')).toBe(true)

    deleteBank('bank_to_delete')
    expect(bankExists('bank_to_delete')).toBe(false)
    expect(getBank('bank_to_delete')).toBeNull()
  })
})

describe('sessionHistory service', () => {
  beforeEach(() => {
    storageStore.clear()
  })

  const mockSession: QuizSession = {
    id: 'session_test_01',
    bankId: 'bank_test',
    bankTitle: 'Test Bank',
    startedAt: '2026-10-25T10:00:00.000Z',
    completedAt: '2026-10-25T10:05:00.000Z',
    totalQuestions: 5,
    attempts: [
      {
        questionId: 'q1',
        selectedOptionId: 'o1',
        result: 'correct',
        timeTakenMs: 1200,
      },
      {
        questionId: 'q2',
        selectedOptionId: 'o2',
        result: 'incorrect',
        timeTakenMs: 1500,
      },
    ],
    questionSnapshots: [],
  }

  it('starts with empty history', () => {
    expect(getHistory()).toEqual([])
  })

  it('records sessions and retrieves them', () => {
    recordSession(mockSession)
    const history = getHistory()
    expect(history).toHaveLength(1)
    expect(history[0].id).toBe(mockSession.id)
  })

  it('removes sessions for a specific bank ID', () => {
    recordSession(mockSession)
    recordSession({
      ...mockSession,
      id: 'session_other',
      bankId: 'other_bank',
    })

    expect(getHistory()).toHaveLength(2)
    removeHistoryForBank('bank_test')

    const remaining = getHistory()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].bankId).toBe('other_bank')
  })

  it('clears all session history', () => {
    recordSession(mockSession)
    expect(getHistory()).toHaveLength(1)

    clearHistory()
    expect(getHistory()).toHaveLength(0)
  })
})
