import { describe, it, expect } from 'vitest'
import {
  validateBank,
  validateQuestionForm,
  validateImageFile,
  isValidBank,
} from '../src/services/questionValidation'
import { SCHEMA_VERSION } from '../src/types'
import type { QuestionBank } from '../src/types'

import { DEMO_BANKS } from '../src/data/demoBanks'

const validBank: QuestionBank = {
  schemaVersion: SCHEMA_VERSION,
  id: 'bank_valid_01',
  title: 'Git Version Control',
  description: 'Git commands and concepts',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  questions: [
    {
      id: 'q1',
      type: 'multiple-choice',
      text: 'Which command stages all modified files?',
      image: null,
      options: [
        { id: 'opt_1', text: 'git add .' },
        { id: 'opt_2', text: 'git stage all' },
        { id: 'opt_3', text: 'git commit -a' },
        { id: 'opt_4', text: 'git push' },
      ],
      correctOptionId: 'opt_1',
      explanation: 'git add . stages all changes in the current directory.',
    },
  ],
}

describe('validateBank and isValidBank', () => {
  it('accepts a valid bank', () => {
    const result = validateBank(validBank)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(isValidBank(validBank)).toBe(true)
  })

  it('validates bundled demo banks successfully', () => {
    expect(DEMO_BANKS.length).toBeGreaterThanOrEqual(2)
    DEMO_BANKS.forEach((b) => {
      const res = validateBank(b)
      expect(res.valid).toBe(true)
      expect(res.errors).toHaveLength(0)
      expect(b.questions.length).toBeGreaterThan(0)
    })
  })

  it('rejects null or non-object payloads', () => {
    expect(validateBank(null).valid).toBe(false)
    expect(validateBank(undefined).valid).toBe(false)
    expect(validateBank('string').valid).toBe(false)
    expect(validateBank(123).valid).toBe(false)
    expect(isValidBank(null)).toBe(false)
  })

  it('rejects missing or unsupported schemaVersion', () => {
    const missingSchema = { ...validBank } as any
    delete missingSchema.schemaVersion
    expect(validateBank(missingSchema).valid).toBe(false)

    const futureSchema = { ...validBank, schemaVersion: 999 }
    const res = validateBank(futureSchema)
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.includes('Unsupported schemaVersion'))).toBe(true)
  })

  it('rejects missing or empty title', () => {
    const missingTitle = { ...validBank, title: '   ' }
    const res = validateBank(missingTitle)
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.includes('title'))).toBe(true)
  })

  it('warns when bank has 0 questions', () => {
    const emptyBank = { ...validBank, questions: [] }
    const res = validateBank(emptyBank)
    expect(res.valid).toBe(true)
    expect(res.warnings).toHaveLength(1)
    expect(res.warnings[0]).toContain('contains no questions')
  })

  it('rejects duplicate question IDs', () => {
    const dupeBank: QuestionBank = {
      ...validBank,
      questions: [
        validBank.questions[0],
        { ...validBank.questions[0] }, // duplicate ID
      ],
    }
    const res = validateBank(dupeBank)
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.includes('Duplicate question ID'))).toBe(true)
  })

  it('rejects question with not exactly 4 options', () => {
    const threeOptsBank = {
      ...validBank,
      questions: [
        {
          ...validBank.questions[0],
          options: [
            { id: 'o1', text: '1' },
            { id: 'o2', text: '2' },
            { id: 'o3', text: '3' },
          ],
        },
      ],
    }
    const res = validateBank(threeOptsBank)
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.includes('Must have exactly 4 answer options'))).toBe(true)
  })

  it('rejects question with duplicate option IDs', () => {
    const dupeOptBank: QuestionBank = {
      ...validBank,
      questions: [
        {
          ...validBank.questions[0],
          options: [
            { id: 'same_opt', text: 'A' },
            { id: 'same_opt', text: 'B' },
            { id: 'opt_3', text: 'C' },
            { id: 'opt_4', text: 'D' },
          ],
        },
      ],
    }
    const res = validateBank(dupeOptBank)
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.includes('Duplicate option ID'))).toBe(true)
  })

  it('rejects correctOptionId that does not exist among options', () => {
    const badCorrectBank: QuestionBank = {
      ...validBank,
      questions: [
        {
          ...validBank.questions[0],
          correctOptionId: 'non_existent_id',
        },
      ],
    }
    const res = validateBank(badCorrectBank)
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.includes('correctOptionId'))).toBe(true)
  })

  it('validates image payload format', () => {
    const invalidImageBank: QuestionBank = {
      ...validBank,
      questions: [
        {
          ...validBank.questions[0],
          image: 'https://example.com/not-data-image-url.png',
        },
      ],
    }
    const res = validateBank(invalidImageBank)
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.includes('data:image/'))).toBe(true)
  })
})

describe('validateQuestionForm', () => {
  const options = [
    { id: 'o1', text: 'Command Line Interface' },
    { id: 'o2', text: 'Common Language Interpreter' },
    { id: 'o3', text: 'Control Loop Instruction' },
    { id: 'o4', text: 'Central Log Inspector' },
  ]

  it('validates a complete question without form errors', () => {
    const errs = validateQuestionForm('What does CLI stand for?', options, 'o1', null)
    expect(Object.keys(errs)).toHaveLength(0)
  })

  it('rejects empty question text', () => {
    const errs = validateQuestionForm('   ', options, 'o1', null)
    expect(errs.text).toBe('Question text is required.')
  })

  it('rejects empty option text', () => {
    const badOptions = [
      { id: 'o1', text: '' },
      { id: 'o2', text: 'B' },
      { id: 'o3', text: 'C' },
      { id: 'o4', text: 'D' },
    ]
    const errs = validateQuestionForm('Question?', badOptions, 'o2', null)
    expect(errs.options).toBeDefined()
    expect(errs.options?.[0]).toBe('Option text is required.')
  })

  it('rejects unselected correct option', () => {
    const errs = validateQuestionForm('Question?', options, '', null)
    expect(errs.correctOptionId).toBe('Select the correct answer.')
  })
})

describe('validateImageFile', () => {
  it('validates supported file types and size limit', () => {
    const validFile = new File(['image-content'], 'pic.png', { type: 'image/png' })
    expect(validateImageFile(validFile)).toBeNull()

    const unsupportedFile = new File(['data'], 'doc.pdf', { type: 'application/pdf' })
    expect(validateImageFile(unsupportedFile)).toContain('Unsupported image type')
  })
})
