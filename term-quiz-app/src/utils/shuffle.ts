/**
 * In-place Fisher–Yates shuffle.
 * Returns the same array for convenience.
 */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Returns a new shuffled copy without mutating the original.
 */
export function shuffled<T>(arr: readonly T[]): T[] {
  return shuffle([...arr])
}
