/**
 * bankStorage.ts
 *
 * Manages question banks in localStorage.
 * Key: termquiz_bank_<id>
 * Index: termquiz_bank_index  (string[] of IDs)
 */

import type { QuestionBank } from '../types'

const INDEX_KEY = 'termquiz_bank_index'
const BANK_KEY_PREFIX = 'termquiz_bank_'

function bankKey(id: string): string {
  return `${BANK_KEY_PREFIX}${id}`
}

function getIndex(): string[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveIndex(ids: string[]): void {
  localStorage.setItem(INDEX_KEY, JSON.stringify(ids))
}

/** List all stored question banks (sorted by updatedAt descending). */
export function listBanks(): QuestionBank[] {
  const ids = getIndex()
  const banks: QuestionBank[] = []
  for (const id of ids) {
    const raw = localStorage.getItem(bankKey(id))
    if (raw) {
      try {
        banks.push(JSON.parse(raw) as QuestionBank)
      } catch {
        // corrupted entry — skip
      }
    }
  }
  return banks.sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))
}

/** Get a single bank by ID. Returns null if not found. */
export function getBank(id: string): QuestionBank | null {
  const raw = localStorage.getItem(bankKey(id))
  if (!raw) return null
  try {
    return JSON.parse(raw) as QuestionBank
  } catch {
    return null
  }
}

/** Save or update a question bank. Throws if localStorage is unavailable. */
export function saveBank(bank: QuestionBank): void {
  try {
    localStorage.setItem(bankKey(bank.id), JSON.stringify(bank))
    const ids = getIndex()
    if (!ids.includes(bank.id)) {
      ids.push(bank.id)
      saveIndex(ids)
    }
  } catch (err) {
    throw new Error(`Failed to save question bank "${bank.title}". Storage may be full.\n${String(err)}`)
  }
}

/** Delete a bank by ID. */
export function deleteBank(id: string): void {
  localStorage.removeItem(bankKey(id))
  const ids = getIndex().filter((i) => i !== id)
  saveIndex(ids)
}

/** Check if a bank ID already exists. */
export function bankExists(id: string): boolean {
  return localStorage.getItem(bankKey(id)) !== null
}

/** Check if localStorage is available. */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__termquiz_test__'
    localStorage.setItem(testKey, '1')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

import { DEMO_BANKS } from '../data/demoBanks'

const INITIALIZED_KEY = 'termquiz_initialized_default'

/** Automatically import demo banks as default settings for first-time users. */
export function initializeDefaultBanks(): void {
  if (!isStorageAvailable()) return
  try {
    const alreadyInitialized = localStorage.getItem(INITIALIZED_KEY)
    if (alreadyInitialized) return

    for (const demo of DEMO_BANKS) {
      if (!bankExists(demo.id)) {
        saveBank(demo)
      }
    }
    localStorage.setItem(INITIALIZED_KEY, 'true')
  } catch {
    // ignore
  }
}
