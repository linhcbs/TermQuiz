import type { QuestionBank, ValidationResult } from '../types'
import { SCHEMA_VERSION } from '../types'

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
const MAX_IMAGE_BYTES = 2 * 1024 * 1024 // 2 MB

// ─── Bank Validation ─────────────────────────────────────────────────────────

export function validateBank(data: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['File does not contain a JSON object.'], warnings: [] }
  }

  const obj = data as Record<string, unknown>

  // Schema version
  if (obj.schemaVersion === undefined) {
    errors.push('Missing schemaVersion field.')
  } else if (typeof obj.schemaVersion !== 'number' || !Number.isInteger(obj.schemaVersion)) {
    errors.push('schemaVersion must be an integer.')
  } else if (obj.schemaVersion > SCHEMA_VERSION) {
    errors.push(`Unsupported schemaVersion ${obj.schemaVersion}. This app supports up to version ${SCHEMA_VERSION}.`)
  } else if (obj.schemaVersion < SCHEMA_VERSION) {
    warnings.push(`schemaVersion ${obj.schemaVersion} is older than current version ${SCHEMA_VERSION}; data will be accepted.`)
  }

  if (!obj.id || typeof obj.id !== 'string') errors.push('Missing or invalid bank id.')
  if (!obj.title || typeof obj.title !== 'string' || !(obj.title as string).trim()) {
    errors.push('Missing or empty bank title.')
  }
  if (obj.description !== undefined && typeof obj.description !== 'string') {
    errors.push('description must be a string if provided.')
  }

  if (!Array.isArray(obj.questions)) {
    errors.push('questions must be an array.')
    return { valid: errors.length === 0, errors, warnings }
  }

  if ((obj.questions as unknown[]).length === 0) {
    warnings.push('Question bank contains no questions.')
  }

  const seenQuestionIds = new Set<string>()

  ;(obj.questions as unknown[]).forEach((q: unknown, i: number) => {
    const qErrors = validateQuestion(q, i)
    errors.push(...qErrors)

    if (q && typeof q === 'object') {
      const qObj = q as Record<string, unknown>
      if (typeof qObj.id === 'string') {
        if (seenQuestionIds.has(qObj.id)) {
          errors.push(`Duplicate question ID "${qObj.id}" found.`)
        }
        seenQuestionIds.add(qObj.id)
      }
    }
  })

  return { valid: errors.length === 0, errors, warnings }
}

function validateQuestion(q: unknown, index: number): string[] {
  const errors: string[] = []
  const prefix = `Question ${index + 1}`

  if (!q || typeof q !== 'object') {
    errors.push(`${prefix}: is not an object.`)
    return errors
  }

  const obj = q as Record<string, unknown>

  if (!obj.id || typeof obj.id !== 'string') errors.push(`${prefix}: Missing or invalid id.`)
  if (obj.type !== 'multiple-choice') errors.push(`${prefix}: Unsupported or missing question type (expected "multiple-choice").`)
  if (!obj.text || typeof obj.text !== 'string' || !(obj.text as string).trim()) {
    errors.push(`${prefix}: Missing or empty question text.`)
  }

  if (obj.image !== null && obj.image !== undefined) {
    if (typeof obj.image !== 'string') {
      errors.push(`${prefix}: image must be a string data URL or null.`)
    } else if (!(obj.image as string).startsWith('data:image/')) {
      errors.push(`${prefix}: image must be a data URL starting with "data:image/".`)
    }
  }

  if (!Array.isArray(obj.options)) {
    errors.push(`${prefix}: options must be an array.`)
    return errors
  }

  if ((obj.options as unknown[]).length !== 4) {
    errors.push(`${prefix}: Must have exactly 4 answer options, found ${(obj.options as unknown[]).length}.`)
  }

  const optionIds = new Set<string>()
  ;(obj.options as unknown[]).forEach((opt: unknown, j: number) => {
    if (!opt || typeof opt !== 'object') {
      errors.push(`${prefix}: Option ${j + 1} is not an object.`)
      return
    }
    const optObj = opt as Record<string, unknown>
    if (!optObj.id || typeof optObj.id !== 'string') {
      errors.push(`${prefix}: Option ${j + 1} has missing or invalid id.`)
    } else {
      if (optionIds.has(optObj.id as string)) {
        errors.push(`${prefix}: Duplicate option ID "${optObj.id}".`)
      }
      optionIds.add(optObj.id as string)
    }
    if (!optObj.text || typeof optObj.text !== 'string' || !(optObj.text as string).trim()) {
      errors.push(`${prefix}: Option ${j + 1} has missing or empty text.`)
    }
  })

  if (!obj.correctOptionId || typeof obj.correctOptionId !== 'string') {
    errors.push(`${prefix}: Missing or invalid correctOptionId.`)
  } else if (!optionIds.has(obj.correctOptionId as string)) {
    errors.push(`${prefix}: correctOptionId "${obj.correctOptionId}" does not match any option id.`)
  }

  if (obj.explanation !== null && obj.explanation !== undefined && typeof obj.explanation !== 'string') {
    errors.push(`${prefix}: explanation must be a string or null.`)
  }

  return errors
}

// ─── Single Question Validation (for editor) ─────────────────────────────────

export interface QuestionFormErrors {
  text?: string
  options?: (string | undefined)[]
  correctOptionId?: string
  image?: string
}

export function validateQuestionForm(
  text: string,
  options: { id: string; text: string }[],
  correctOptionId: string,
  imageSrc: string | null,
): QuestionFormErrors {
  const errs: QuestionFormErrors = {}

  if (!text.trim()) errs.text = 'Question text is required.'

  const optionErrors: (string | undefined)[] = options.map((opt) =>
    !opt.text.trim() ? 'Option text is required.' : undefined,
  )
  if (optionErrors.some(Boolean)) errs.options = optionErrors

  if (!correctOptionId) errs.correctOptionId = 'Select the correct answer.'
  else if (!options.some((o) => o.id === correctOptionId)) {
    errs.correctOptionId = 'Correct answer must reference an existing option.'
  }

  if (imageSrc) {
    if (!imageSrc.startsWith('data:image/')) {
      errs.image = 'Image must be a valid data URL.'
    }
  }

  return errs
}

// ─── Image Validation ─────────────────────────────────────────────────────────

export function validateImageFile(file: File): string | null {
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    return `Unsupported image type "${file.type}". Allowed: JPEG, PNG, GIF, WebP, SVG.`
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 2 MB.`
  }
  return null
}

// ─── Type Guard ───────────────────────────────────────────────────────────────

export function isValidBank(data: unknown): data is QuestionBank {
  return validateBank(data).valid
}
