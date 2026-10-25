/**
 * terminalLog.ts
 *
 * Reactive store for terminal-style system messages.
 * Exported as a composable so any component can append messages.
 */

import { ref } from 'vue'
import type { LogEntry, LogLevel } from '../types'
import { generateId } from '../utils/helpers'

const MAX_ENTRIES = 200

const entries = ref<LogEntry[]>([])

function now(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false })
}

function addEntry(level: LogLevel, message: string): void {
  const entry: LogEntry = {
    id: generateId('log'),
    timestamp: now(),
    level,
    message,
  }
  entries.value = [entry, ...entries.value].slice(0, MAX_ENTRIES)
}

export function useTerminalLog() {
  return {
    entries,

    info: (msg: string) => addEntry('info', msg),
    ok: (msg: string) => addEntry('ok', msg),
    warn: (msg: string) => addEntry('warn', msg),
    error: (msg: string) => addEntry('error', msg),
    quiz: (msg: string) => addEntry('quiz', msg),
    debug: (msg: string) => addEntry('debug', msg),

    clear: () => {
      entries.value = []
    },
  }
}
