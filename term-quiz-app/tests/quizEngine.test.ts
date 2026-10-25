import { describe, it, expect } from 'vitest'
import {
  createSession,
  selectOption,
  submitAnswer,
  advanceQuestion,
  currentQuestion,
  currentOptions,
  computeScore,
  type ActiveSession,
} from '../src/services/quizEngine'
import { shuffled } from '../src/utils/shuffle'
import type { QuestionBank } from '../src/types'

const mockBank: QuestionBank = {
  schemaVersion: 1,
  id: 'test_bank_01',
  title: 'Linux & Terminal Knowledge',
  description: 'Test bank for unit testing',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  questions: [
    {
      id: 'q1',
      type: 'multiple-choice',
      text: 'Which command lists directory contents?',
      image: null,
      options: [
        { id: 'opt_1a', text: 'ls' },
        { id: 'opt_1b', text: 'cd' },
        { id: 'opt_1c', text: 'pwd' },
        { id: 'opt_1d', text: 'cat' },
      ],
      correctOptionId: 'opt_1a',
      explanation: 'ls is used to list directory contents.',
    },
    {
      id: 'q2',
      type: 'multiple-choice',
      text: 'Which command prints the current working directory?',
      image: null,
      options: [
        { id: 'opt_2a', text: 'dir' },
        { id: 'opt_2b', text: 'pwd' },
        { id: 'opt_2c', text: 'whereami' },
        { id: 'opt_2d', text: 'locate' },
      ],
      correctOptionId: 'opt_2b',
      explanation: 'pwd stands for print working directory.',
    },
    {
      id: 'q3',
      type: 'multiple-choice',
      text: 'Which signal corresponds to SIGKILL?',
      image: null,
      options: [
        { id: 'opt_3a', text: 'Signal 9' },
        { id: 'opt_3b', text: 'Signal 15' },
        { id: 'opt_3c', text: 'Signal 2' },
        { id: 'opt_3d', text: 'Signal 1' },
      ],
      correctOptionId: 'opt_3a',
      explanation: 'SIGKILL is signal 9.',
    },
  ],
}

describe('shuffled utility', () => {
  it('returns a new array with the same length and elements', () => {
    const original = [1, 2, 3, 4, 5]
    const result = shuffled(original)
    expect(result).toHaveLength(original.length)
    expect([...result].sort()).toEqual([...original].sort())
    expect(result).not.toBe(original)
  })

  it('does not mutate original array', () => {
    const original = ['a', 'b', 'c', 'd']
    const copy = [...original]
    shuffled(original)
    expect(original).toEqual(copy)
  })
})

describe('quizEngine - session lifecycle', () => {
  it('initializes a session with questions and shuffled options', () => {
    const session = createSession(mockBank)

    expect(session.session.bankId).toBe(mockBank.id)
    expect(session.session.bankTitle).toBe(mockBank.title)
    expect(session.session.totalQuestions).toBe(3)
    expect(session.questions).toHaveLength(3)
    expect(session.shuffledOptions).toHaveLength(3)
    expect(session.currentIndex).toBe(0)
    expect(session.pendingSelection).toBeNull()
    expect(session.submitted).toBe(false)
    expect(session.complete).toBe(false)

    // Verify all original question IDs are present
    const originalIds = mockBank.questions.map((q) => q.id).sort()
    const sessionIds = session.questions.map((q) => q.id).sort()
    expect(sessionIds).toEqual(originalIds)
  })

  it('does not mutate the source QuestionBank', () => {
    const questionsBefore = JSON.stringify(mockBank.questions)
    createSession(mockBank)
    expect(JSON.stringify(mockBank.questions)).toBe(questionsBefore)
  })

  it('each question has exactly 4 shuffled options preserved from the source', () => {
    const session = createSession(mockBank)
    session.questions.forEach((q, idx) => {
      const opts = session.shuffledOptions[idx]
      expect(opts).toHaveLength(4)
      const originalOptIds = q.options.map((o) => o.id).sort()
      const shuffledOptIds = opts.map((o) => o.id).sort()
      expect(shuffledOptIds).toEqual(originalOptIds)
    })
  })

  it('retrieves currentQuestion and currentOptions correctly', () => {
    const session = createSession(mockBank)
    const q = currentQuestion(session)
    const opts = currentOptions(session)

    expect(q).not.toBeNull()
    expect(q?.id).toBe(session.questions[0].id)
    expect(opts).toEqual(session.shuffledOptions[0])
  })

  it('selectOption sets pendingSelection before submission', () => {
    let session = createSession(mockBank)
    const firstOptionId = session.shuffledOptions[0][0].id

    session = selectOption(session, firstOptionId)
    expect(session.pendingSelection).toBe(firstOptionId)

    // Can change selection before submit
    const secondOptionId = session.shuffledOptions[0][1].id
    session = selectOption(session, secondOptionId)
    expect(session.pendingSelection).toBe(secondOptionId)
  })

  it('prevents selecting another option once submitted', () => {
    let session = createSession(mockBank)
    const optId = session.shuffledOptions[0][0].id
    session = selectOption(session, optId)
    session = submitAnswer(session)

    expect(session.submitted).toBe(true)

    const otherOptId = session.shuffledOptions[0][1].id
    const updated = selectOption(session, otherOptId)
    expect(updated.pendingSelection).toBe(optId)
  })

  it('submitAnswer does nothing if no option is selected', () => {
    let session = createSession(mockBank)
    session = submitAnswer(session)
    expect(session.submitted).toBe(false)
    expect(session.session.attempts).toHaveLength(0)
  })

  it('submitAnswer records correct attempt when correct option selected', () => {
    let session = createSession(mockBank)
    const q = currentQuestion(session)!
    session = selectOption(session, q.correctOptionId)
    session = submitAnswer(session)

    expect(session.submitted).toBe(true)
    expect(session.session.attempts).toHaveLength(1)

    const attempt = session.session.attempts[0]
    expect(attempt.questionId).toBe(q.id)
    expect(attempt.selectedOptionId).toBe(q.correctOptionId)
    expect(attempt.result).toBe('correct')
    expect(attempt.timeTakenMs).toBeGreaterThanOrEqual(0)
  })

  it('submitAnswer records incorrect attempt when wrong option selected', () => {
    let session = createSession(mockBank)
    const q = currentQuestion(session)!
    const wrongOpt = q.options.find((o) => o.id !== q.correctOptionId)!
    session = selectOption(session, wrongOpt.id)
    session = submitAnswer(session)

    expect(session.submitted).toBe(true)
    expect(session.session.attempts).toHaveLength(1)

    const attempt = session.session.attempts[0]
    expect(attempt.questionId).toBe(q.id)
    expect(attempt.selectedOptionId).toBe(wrongOpt.id)
    expect(attempt.result).toBe('incorrect')
  })

  it('advanceQuestion moves to next question and resets pending selection', () => {
    let session = createSession(mockBank)
    const q1 = currentQuestion(session)!
    session = selectOption(session, q1.correctOptionId)
    session = submitAnswer(session)

    session = advanceQuestion(session)
    expect(session.currentIndex).toBe(1)
    expect(session.submitted).toBe(false)
    expect(session.pendingSelection).toBeNull()
    expect(session.complete).toBe(false)
  })

  it('does not advance if question is not yet submitted', () => {
    let session = createSession(mockBank)
    session = advanceQuestion(session)
    expect(session.currentIndex).toBe(0)
  })

  it('marks session as complete when advancing past final question', () => {
    let session: ActiveSession = createSession(mockBank)

    // Complete all 3 questions
    for (let i = 0; i < 3; i++) {
      const q = currentQuestion(session)!
      session = selectOption(session, q.correctOptionId)
      session = submitAnswer(session)
      session = advanceQuestion(session)
    }

    expect(session.complete).toBe(true)
    expect(session.session.completedAt).not.toBeNull()
    expect(session.session.attempts).toHaveLength(3)
  })
})

describe('quizEngine - score computation', () => {
  it('computes accurate score metrics for full quiz run', () => {
    let session = createSession(mockBank)

    // Q1: correct
    const q1 = currentQuestion(session)!
    session = selectOption(session, q1.correctOptionId)
    session = submitAnswer(session)
    session = advanceQuestion(session)

    // Q2: incorrect
    const q2 = currentQuestion(session)!
    const wrong2 = q2.options.find((o) => o.id !== q2.correctOptionId)!.id
    session = selectOption(session, wrong2)
    session = submitAnswer(session)
    session = advanceQuestion(session)

    // Q3: incorrect
    const q3 = currentQuestion(session)!
    const wrong3 = q3.options.find((o) => o.id !== q3.correctOptionId)!.id
    session = selectOption(session, wrong3)
    session = submitAnswer(session)
    session = advanceQuestion(session)

    const score = computeScore(session.session)
    expect(score.correct).toBe(1)
    expect(score.incorrect).toBe(2)
    expect(score.accuracy).toBe(33) // 1/3 = 33%
    expect(score.durationMs).toBeGreaterThanOrEqual(0)
  })

  it('returns 0% accuracy when 0 questions correct', () => {
    let session = createSession(mockBank)
    for (let i = 0; i < 3; i++) {
      const q = currentQuestion(session)!
      const wrong = q.options.find((o) => o.id !== q.correctOptionId)!.id
      session = selectOption(session, wrong)
      session = submitAnswer(session)
      session = advanceQuestion(session)
    }

    const score = computeScore(session.session)
    expect(score.correct).toBe(0)
    expect(score.incorrect).toBe(3)
    expect(score.accuracy).toBe(0)
  })

  it('returns 100% accuracy when all questions correct', () => {
    let session = createSession(mockBank)
    for (let i = 0; i < 3; i++) {
      const q = currentQuestion(session)!
      session = selectOption(session, q.correctOptionId)
      session = submitAnswer(session)
      session = advanceQuestion(session)
    }

    const score = computeScore(session.session)
    expect(score.correct).toBe(3)
    expect(score.incorrect).toBe(0)
    expect(score.accuracy).toBe(100)
  })
})
