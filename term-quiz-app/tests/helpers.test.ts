import { describe, it, expect } from 'vitest'
import { generateId, toSafeFilename, formatDuration, formatTimestamp } from '../src/utils/helpers'

describe('generateId', () => {
  it('generates IDs with given prefix and distinct random parts', () => {
    const id1 = generateId('q')
    const id2 = generateId('q')

    expect(id1.startsWith('q_')).toBe(true)
    expect(id2.startsWith('q_')).toBe(true)
    expect(id1).not.toBe(id2)
  })

  it('uses default id prefix if none provided', () => {
    const id = generateId()
    expect(id.startsWith('id_')).toBe(true)
  })
})

describe('toSafeFilename', () => {
  it('replaces dangerous characters with underscores', () => {
    const filename = toSafeFilename('My Bank: Special Edition! (2026) / [v1]')
    expect(filename).not.toMatch(/[ :!()[\]/]/)
    expect(filename).toContain('My_Bank')
  })

  it('provides a default fallback when title is empty or only special chars', () => {
    expect(toSafeFilename('')).toBe('question_bank')
    expect(toSafeFilename('???***')).toBe('question_bank')
  })

  it('preserves alphanumeric, hyphen, dot, and underscore', () => {
    expect(toSafeFilename('term-quiz_v1.0.json')).toBe('term-quiz_v1.0.json')
  })
})

describe('formatDuration', () => {
  it('formats under one minute in seconds', () => {
    expect(formatDuration(0)).toBe('0s')
    expect(formatDuration(45000)).toBe('45s')
    expect(formatDuration(59000)).toBe('59s')
  })

  it('formats minutes and seconds', () => {
    expect(formatDuration(60000)).toBe('1m 0s')
    expect(formatDuration(125000)).toBe('2m 5s')
    expect(formatDuration(3665000)).toBe('61m 5s')
  })
})

describe('formatTimestamp', () => {
  it('returns em-dash for null or undefined timestamps', () => {
    expect(formatTimestamp(null)).toBe('—')
    expect(formatTimestamp(undefined)).toBe('—')
  })

  it('formats valid ISO date strings', () => {
    const formatted = formatTimestamp('2026-10-25T12:00:00.000Z')
    expect(formatted).not.toBe('—')
    expect(formatted.length).toBeGreaterThan(0)
  })
})
