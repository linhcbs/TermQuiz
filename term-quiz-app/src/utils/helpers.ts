/**
 * Converts an arbitrary string into a safe filename stem.
 * Replaces any character that is not alphanumeric, dash, underscore, or dot
 * with an underscore, then trims leading/trailing underscores.
 */
export function toSafeFilename(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9\-_.]/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 200) || 'question_bank'
}

/**
 * Generates a simple time-based unique ID prefixed by a given prefix.
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Formats an ISO 8601 timestamp for display.
 */
export function formatTimestamp(iso?: string | null): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleString()
  } catch {
    return '—'
  }
}

/**
 * Formats milliseconds as a human-readable duration.
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}
