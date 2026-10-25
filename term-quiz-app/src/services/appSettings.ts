/**
 * appSettings.ts
 *
 * Persistent application settings stored in localStorage.
 */

import { ref, watch } from 'vue'
import type { AppSettings } from '../types'
import { DEFAULT_SETTINGS } from '../types'

const SETTINGS_KEY = 'termquiz_settings'

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS }
}

const settings = ref<AppSettings>(loadSettings())

// Auto-save on change
watch(settings, (val) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(val))
  } catch {
    // ignore
  }
}, { deep: true })

export function useSettings() {
  return { settings }
}
