<script setup lang="ts">
// TerminalShell — The main application chrome
// Renders: titlebar, sidebar nav, main content area, terminal log panel
import { onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TerminalLog from './TerminalLog.vue'

const route = useRoute()
const router = useRouter()

const navLinks = [
  { to: '/', label: 'Dashboard', icon: '⬡', id: 'nav-dashboard' },
  { to: '/banks', label: 'Question Banks', icon: '▤', id: 'nav-banks' },
  { to: '/history', label: 'History', icon: '◷', id: 'nav-history' },
  { to: '/guide', label: 'AI Prompt & Format', icon: '✦', id: 'nav-guide' },
  { to: '/settings', label: 'Settings', icon: '⚙', id: 'nav-settings' },
]

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return

  // Do not navigate tabs if currently inside practice/quiz
  if (route.path.startsWith('/practice')) return

  // Do not navigate tabs if user is typing in an input, textarea, select, or editable element
  const target = e.target as HTMLElement | null
  if (target) {
    const tagName = target.tagName?.toLowerCase()
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable) {
      return
    }
  }

  // Do not navigate tabs if a modal dialog is currently open
  if (document.querySelector('.dialog-overlay')) return

  const currentIndex = navLinks.findIndex((link) => isActive(link.to))

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % navLinks.length
    router.push(navLinks[nextIndex].to)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    const prevIndex = currentIndex === -1 ? 0 : (currentIndex - 1 + navLinks.length) % navLinks.length
    router.push(navLinks[prevIndex].to)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="shell">
    <!-- Terminal Title Bar -->
    <header class="titlebar" role="banner">
      <div class="titlebar-controls" aria-hidden="true">
        <span class="control close"></span>
        <span class="control minimize"></span>
        <span class="control maximize"></span>
      </div>
      <div class="titlebar-title">
        <span class="title-icon text-green">▶</span>
        <span class="title-app">TermQuiz</span>
        <span class="title-sep text-dim">—</span>
        <span class="title-path text-muted">student@termquiz:~/question-banks$</span>
      </div>
      <div class="titlebar-right text-dim">v1.0.0</div>
    </header>

    <div class="shell-body">
      <!-- Sidebar Navigation -->
      <nav class="sidebar" aria-label="Main navigation">
        <div class="sidebar-section">
          <div class="sidebar-label text-dim">NAVIGATION</div>
          <ul class="nav-list" role="list">
            <li v-for="link in navLinks" :key="link.to">
              <router-link
                :id="link.id"
                :to="link.to"
                class="nav-item"
                :class="{ active: isActive(link.to) }"
              >
                <span class="nav-icon" aria-hidden="true">{{ link.icon }}</span>
                <span>{{ link.label }}</span>
              </router-link>
            </li>
          </ul>
        </div>

        <div class="sidebar-footer text-dim">
          <div class="storage-status">
            <span class="status-dot"></span>
            <span>localStorage</span>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="main-content" id="main-content" tabindex="-1">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <!-- Terminal Log Panel -->
    <TerminalLog />
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100svh;
  background: var(--bg-window);
  border: 1px solid var(--border-dim);
}

/* ── Title Bar ──────────────────────────────────────────────── */
.titlebar {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  height: var(--titlebar-height);
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border-dim);
  padding: 0 var(--space-4);
  flex-shrink: 0;
  user-select: none;
}

.titlebar-controls {
  display: flex;
  gap: 6px;
  align-items: center;
}

.control {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}
.control.close    { background: #ff5f57; }
.control.minimize { background: #ffbd2e; }
.control.maximize { background: #28c840; }

.titlebar-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  font-size: 13px;
  overflow: hidden;
}

.title-app {
  color: var(--ansi-green);
  font-weight: 700;
  letter-spacing: 0.5px;
}

.title-sep { font-size: 12.5px; }

.title-path {
  font-size: 12.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.titlebar-right {
  font-size: 12.5px;
  flex-shrink: 0;
}

/* ── Shell body ─────────────────────────────────────────────── */
.shell-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ── Sidebar ────────────────────────────────────────────────── */
.sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  background: var(--bg-panel);
  border-right: 1px solid var(--border-dim);
  display: flex;
  flex-direction: column;
  padding: var(--space-4) 0;
  overflow-y: auto;
}

.sidebar-section { flex: 1; }

.sidebar-label {
  font-size: 12.5px;
  letter-spacing: 1.5px;
  padding: var(--space-2) var(--space-5);
  margin-bottom: var(--space-2);
}

.nav-list {
  list-style: none;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-5);
  color: var(--color-muted);
  text-decoration: none;
  font-size: 13px;
  transition: color var(--transition-fast), background var(--transition-fast);
  cursor: pointer;
  border-left: 2px solid transparent;
}

.nav-item:hover {
  color: var(--color-text);
  background: var(--bg-panel-hover);
  text-decoration: none;
}

.nav-item.active {
  color: var(--ansi-cyan);
  border-left-color: var(--ansi-cyan);
  background: rgba(139, 233, 253, 0.05);
}

.nav-icon {
  width: 16px;
  text-align: center;
  font-size: 14px;
}

.sidebar-footer {
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--border-dim);
  font-size: 12.5px;
}

.storage-status {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ansi-green);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ── Main Content ───────────────────────────────────────────── */
.main-content {
  flex: 1;
  overflow-y: auto;
  background: var(--bg-terminal);
  outline: none;
}

/* ── Page transition ────────────────────────────────────────── */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity var(--transition-fast);
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}

/* ── Responsive: collapse sidebar on small screens ──────────── */
@media (max-width: 720px) {
  .sidebar {
    width: 48px;
    padding: var(--space-4) 0;
  }
  .sidebar-label,
  .nav-item span:last-child,
  .sidebar-footer,
  .title-path {
    display: none;
  }
  .nav-item {
    justify-content: center;
    padding: var(--space-3);
  }
  .nav-icon { width: auto; font-size: 16px; }
}
</style>
