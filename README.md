# TermQuiz

A distraction-free, terminal-styled multiple choice quiz app for fast studying. No accounts, no tracking, fully offline.

👉 **[Live Demo](https://linhcbs.github.io/TermQuiz/)**

![TermQuiz Practice Session](docs/screenshots/quiz-practice.png)

---

## Features

- **Keyboard-first & mobile-friendly** — Full keyboard navigation on desktop; responsive layout on mobile.
- **Inline question editing** — Edit questions directly in place, no page jumps.
- **100% Offline & Private** — All data stays in your browser's `localStorage`.
- **Randomized quizzes** — Questions and options shuffle every run.
- **AI-friendly import** — Use provided prompt templates with ChatGPT, Claude, Gemini, or DeepSeek to convert study guides (PDF, Word, images) into ready-to-import `.json` banks.
- **Single-file export** — Build everything into one standalone `main.html` — no server, no install; just double-click to open.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Vue 3](https://vuejs.org/) (Composition API + `<script setup>`) |
| Language | TypeScript |
| Build tool | [Vite](https://vite.dev/) + [vite-plugin-singlefile](https://github.com/richardtallent/vite-plugin-singlefile) |
| Routing | Vue Router 4 |
| Styling | Vanilla CSS (scoped), CSS custom properties, JetBrains Mono |
| Storage | Browser `localStorage` (local-first, no backend) |
| Testing | [Vitest](https://vitest.dev/) |
| Deployment | GitHub Pages via GitHub Actions |

---

## Getting Started

> **Just want to try it?** Use the [live demo](https://linhcbs.github.io/TermQuiz/) — no install needed.

### Option A — Open the standalone file (no install)

Download [`main.html`](main.html) from the repo root, then double-click it to open in any modern browser. Everything (JS, CSS, fonts) is bundled inside — no server required.

### Option B — Run locally with hot-reload

```bash
# 1. Install Node.js (https://nodejs.org/) if you haven't already

# 2. Clone or download this repo, then:
cd term-quiz-app
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

### Rebuilding `main.html` after code changes

```bash
cd term-quiz-app
npm run build
cp dist/index.html ../main.html
```

---

## Quick Guide

![TermQuiz Dashboard](docs/screenshots/dashboard.png)

### Adding Questions

![Question Banks View](docs/screenshots/question-banks.png)

- **Demo Banks** — Click `demo banks` to load sample Linux CLI & Git questions.
- **Manual Entry** — Click `+ new bank` to create questions by hand.
- **AI Import (fastest)** — Open the **✦ AI Prompt & Format** tab, copy the prompt, paste it into any AI with your study material, save the output as `.json`, then import via `↓ import`.

![AI Prompt & Format Guide](docs/screenshots/ai-guide.png)

### Taking a Quiz

1. Click `▶ practice` on any bank.
2. Select an answer with `1`–`4` / `A`–`D`, then press `Enter` to submit.
3. Immediate feedback shows the correct answer and explanation.
4. Press `Enter` again (or `X` / `Esc`) to continue or exit.

### Reviewing Results

After a session, view your accuracy, score, and duration. Filter by **Incorrect Only** to focus on mistakes. All history is saved under the **History** tab.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `↑` / `↓` | Switch sidebar tabs (main pages) |
| `↑` / `↓` / `←` / `→` | Navigate buttons on Dashboard & Question Banks |
| `Tab` / `Shift+Tab` | Cycle focus between inputs and buttons |
| `1`–`4` or `A`–`D` | Pick answer option |
| `↑` / `↓` (quiz) | Move answer cursor |
| `Space` | Select option under cursor |
| `Enter` | Submit / advance / activate focused element |
| `X` or `Esc` | Open exit prompt |
| `C` / `E` (exit prompt) | Cancel / confirm exit |

---

## Sharing

Export any bank via `↓ export` and share the `.json` file with classmates. They can import it directly into their own TermQuiz instance.

You can also share the `main.html` file itself — recipients just double-click it, no install needed.
