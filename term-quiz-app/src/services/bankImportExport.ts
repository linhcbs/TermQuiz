/**
 * bankImportExport.ts
 *
 * Handles importing question banks from JSON files and
 * exporting them as downloadable JSON files.
 */

import type { QuestionBank } from '../types'
import { SCHEMA_VERSION } from '../types'
import { validateBank } from './questionValidation'
import { toSafeFilename } from '../utils/helpers'

// ─── Import ───────────────────────────────────────────────────────────────────

export interface ImportResult {
  success: boolean
  bank: QuestionBank | null
  errors: string[]
  warnings: string[]
}

/**
 * Reads a File object and attempts to parse + validate it as a QuestionBank.
 * Does NOT persist the bank — that's the caller's responsibility.
 */
export async function importBankFromFile(file: File): Promise<ImportResult> {
  if (!file.name.endsWith('.json')) {
    return { success: false, bank: null, errors: ['File must have a .json extension.'], warnings: [] }
  }

  let text: string
  try {
    text = await file.text()
  } catch {
    return { success: false, bank: null, errors: ['Could not read the selected file.'], warnings: [] }
  }

  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { success: false, bank: null, errors: ['File contains malformed JSON. Please check the file.'], warnings: [] }
  }

  const validation = validateBank(data)

  if (!validation.valid) {
    return { success: false, bank: null, errors: validation.errors, warnings: validation.warnings }
  }

  const bank = data as QuestionBank
  return { success: true, bank, errors: [], warnings: validation.warnings }
}

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * Triggers a browser download of the given bank as a formatted JSON file.
 */
export function exportBankToFile(bank: QuestionBank): void {
  const exportedBank: QuestionBank = {
    ...bank,
    schemaVersion: SCHEMA_VERSION,
  }

  const json = JSON.stringify(exportedBank, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const filename = `${toSafeFilename(bank.title)}.json`

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)

  // Revoke after a tick to allow the download to initiate
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
