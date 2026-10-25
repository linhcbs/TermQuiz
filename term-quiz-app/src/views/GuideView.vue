<script setup lang="ts">
// GuideView — AI Prompt and JSON Bank Format Guide
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTerminalLog } from '../services/terminalLog'

const router = useRouter()
const { ok } = useTerminalLog()

const promptCopied = ref(false)
const jsonCopied = ref(false)

const aiPromptText = `You are an expert study data conversion assistant. I need you to convert all multiple-choice questions from the attached document (or image/text below) into a standard JSON question bank format for the TermQuiz application.
 
MANDATORY JSON SCHEMA RULES (100% STRICT COMPLIANCE):
1. Overall file structure:
{
  "schemaVersion": 1,
  "id": "unique_bank_slug",
  "title": "Question Bank Title / Subject Name",
  "description": "Short description of the subject or study guide",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z",
  "questions": [ ... ]
}

2. Every question in the "questions" array MUST have the following fields:
{
  "id": "q1",
  "type": "multiple-choice",
  "text": "Full question prompt text",
  "image": null,
  "options": [
    { "id": "q1_opt_a", "text": "Option A text" },
    { "id": "q1_opt_b", "text": "Option B text" },
    { "id": "q1_opt_c", "text": "Option C text" },
    { "id": "q1_opt_d", "text": "Option D text" }
  ],
  "correctOptionId": "q1_opt_a",
  "explanation": "Concise and clear explanation why this answer is correct."
}

3. CRITICAL RULES:
- Every question MUST HAVE EXACTLY 4 OPTIONS (options array length must be exactly 4).
- "correctOptionId" MUST MATCH the "id" of one of the 4 options. If the document lacks answers, use domain knowledge to select the best correct option.
- "id" for questions ("q1", "q2", ...) and options ("q1_opt_a", "q1_opt_b", ...) must be unique and non-colliding.
- "type" is always the string literal "multiple-choice".
- "image" should be null (unless you have a valid data:image URI).
- Preserve math formulas, technical terms, and code snippets exactly as they are in "text" and "options".
- "explanation" should be clear and concise.
- RETURN ONLY VALID RAW JSON (starting with { and ending with }), NO GREETINGS, NO MARKDOWN OUTSIDE THE JSON BLOCK, NO CHATTY TEXT.`

const sampleJsonText = `{
  "schemaVersion": 1,
  "id": "dev_study_guide_sample",
  "title": "Software Engineering & Git Basics",
  "description": "Sample practice questions formatted for TermQuiz",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z",
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "text": "Which Git command creates a new branch and immediately switches to it?",
      "image": null,
      "options": [
        { "id": "q1_opt_a", "text": "git switch -c <branch-name>" },
        { "id": "q1_opt_b", "text": "git branch --new <branch-name>" },
        { "id": "q1_opt_c", "text": "git create <branch-name>" },
        { "id": "q1_opt_d", "text": "git commit -b <branch-name>" }
      ],
      "correctOptionId": "q1_opt_a",
      "explanation": "The 'git switch -c <name>' (or 'git checkout -b <name>') command creates and checks out a new branch in a single step."
    },
    {
      "id": "q2",
      "type": "multiple-choice",
      "text": "In HTTP protocol specifications, what does status code 404 signify?",
      "image": null,
      "options": [
        { "id": "q2_opt_a", "text": "Bad Request - The request cannot be fulfilled due to bad syntax" },
        { "id": "q2_opt_b", "text": "Unauthorized - Authentication is required" },
        { "id": "q2_opt_c", "text": "Not Found - The server cannot find the requested resource" },
        { "id": "q2_opt_d", "text": "Internal Server Error - The server encountered an unexpected condition" }
      ],
      "correctOptionId": "q2_opt_c",
      "explanation": "HTTP 404 Not Found indicates that the server cannot locate the resource corresponding to the requested URI."
    }
  ]
}`

async function copyPrompt() {
  try {
    await navigator.clipboard.writeText(aiPromptText)
    promptCopied.value = true
    ok('Copied AI Prompt to clipboard.')
    setTimeout(() => {
      promptCopied.value = false
    }, 2500)
  } catch {
    ok('Unable to copy automatically. Please select and copy manually.')
  }
}

async function copyJson() {
  try {
    await navigator.clipboard.writeText(sampleJsonText)
    jsonCopied.value = true
    ok('Copied Sample JSON to clipboard.')
    setTimeout(() => {
      jsonCopied.value = false
    }, 2500)
  } catch {
    ok('Unable to copy automatically. Please select and copy manually.')
  }
}

function downloadSampleJson() {
  const blob = new Blob([sampleJsonText], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'termquiz-sample-bank.json'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  ok('Downloaded sample JSON template.')
}
</script>

<template>
  <div class="guide-view">

    <!-- Header -->
    <div class="guide-header">
      <div class="header-main">
        <h1 class="view-title">
          <span class="text-cyan">$</span> termquiz-guide --format-and-prompt
        </h1>
        <p class="view-sub text-dim">
          Question bank .json schema specification &amp; ready-to-use AI prompts (ChatGPT, Claude, Gemini, DeepSeek) to convert PDF, Word, or image materials into valid JSON banks.
        </p>
      </div>
      <div class="header-actions">
        <button class="btn-cli btn-cli-active" @click="router.push('/banks')">
          [-> question banks]
        </button>
      </div>
    </div>

    <div class="ascii-rule text-dim">------------------------------------------------------------</div>

    <!-- Quick Workflow -->
    <div class="section">
      <div class="section-title text-dim">
        <span class="text-cyan">//</span> 01. workflow overview
      </div>
      <div class="workflow-steps">
        <div class="step-card">
          <span class="step-num text-cyan">[01]</span>
          <div class="step-content">
            <span class="step-title">Copy AI Prompt</span>
            <br/>
            <span class="step-desc text-dim">Click the button below to copy the prompt template tailored for LLMs.</span>
          </div>
        </div>
        <div class="step-card">
          <span class="step-num text-green">[02]</span>
          <div class="step-content">
            <span class="step-title">Send to AI</span>
            <br/>
            <span class="step-desc text-dim">Open ChatGPT, Claude, Gemini, or DeepSeek. Attach your study material and paste the prompt.</span>
          </div>
        </div>
        <div class="step-card">
          <span class="step-num text-magenta">[03]</span>
          <div class="step-content">
            <span class="step-title">Save .json File</span>
            <br/>
            <span class="step-desc text-dim">Copy the generated JSON output and save it as a <code class="code-inline">.json</code> file on your computer.</span>
          </div>
        </div>
        <div class="step-card">
          <span class="step-num text-orange">[04]</span>
          <div class="step-content">
            <span class="step-title">Import &amp; Practice</span>
            <br/>
            <span class="step-desc text-dim">Head over to Question Banks, click <strong>↓ import</strong>, and start your test session immediately!</span>
          </div>
        </div>
      </div>
    </div>

    <div class="ascii-rule text-dim">------------------------------------------------------------</div>

    <!-- Section: AI Prompt -->
    <div class="section">
      <div class="section-header-bar">
        <div class="section-title text-dim">
          <span class="text-cyan">//</span> 02. prompt template for ai (chatgpt / claude / gemini / deepseek)
        </div>
        <div class="action-bar">
          <button class="btn-cli" :class="{ 'btn-cli-active': promptCopied }" @click="copyPrompt">
            {{ promptCopied ? '[✓ copied to clipboard!]' : '[copy prompt]' }}
          </button>
        </div>
      </div>
      <p class="section-hint text-dim">
        This prompt instructs the AI to read your source materials (PDF, Word, screenshots), extract each question, craft concise explanations, ensure exactly 4 options, and return 100% compliant JSON.
      </p>
      <div class="code-block-wrapper">
        <pre class="code-box"><code>{{ aiPromptText }}</code></pre>
      </div>
    </div>

    <div class="ascii-rule text-dim">------------------------------------------------------------</div>

    <!-- Section: JSON Specification -->
    <div class="section">
      <div class="section-title text-dim">
        <span class="text-cyan">//</span> 03. json data schema specification
      </div>
      <div class="spec-grid">
        <div class="spec-row">
          <span class="spec-field text-cyan">schemaVersion</span>
          <span class="spec-type text-magenta">number</span>
          <span class="spec-desc">Must be exactly <code class="code-inline">1</code>.</span>
        </div>
        <div class="spec-row">
          <span class="spec-field text-cyan">id</span>
          <span class="spec-type text-magenta">string</span>
          <span class="spec-desc">Unique identifier slug for the bank, e.g. <code class="code-inline">"os_fundamentals"</code>.</span>
        </div>
        <div class="spec-row">
          <span class="spec-field text-cyan">title</span>
          <span class="spec-type text-magenta">string</span>
          <span class="spec-desc">Display title of the question bank (e.g., <code class="code-inline">"Operating Systems Exam"</code>).</span>
        </div>
        <div class="spec-row">
          <span class="spec-field text-cyan">description</span>
          <span class="spec-type text-dim">string</span>
          <span class="spec-desc">Short summary or topic description (optional).</span>
        </div>
        <div class="spec-row">
          <span class="spec-field text-cyan">createdAt / updatedAt</span>
          <span class="spec-type text-dim">string</span>
          <span class="spec-desc">Standard ISO 8601 timestamp string (e.g. <code class="code-inline">"2026-01-01T00:00:00.000Z"</code>).</span>
        </div>
        <div class="spec-row">
          <span class="spec-field text-cyan">questions</span>
          <span class="spec-type text-magenta">array</span>
          <span class="spec-desc">Array containing quiz question objects.</span>
        </div>
        <div class="spec-row">
          <span class="spec-field text-cyan">questions[].id</span>
          <span class="spec-type text-magenta">string</span>
          <span class="spec-desc">Unique question ID (e.g., <code class="code-inline">"q1"</code>, <code class="code-inline">"q2"</code>).</span>
        </div>
        <div class="spec-row">
          <span class="spec-field text-cyan">questions[].type</span>
          <span class="spec-type text-magenta">string</span>
          <span class="spec-desc">Fixed string literal <code class="code-inline">"multiple-choice"</code>.</span>
        </div>
        <div class="spec-row">
          <span class="spec-field text-cyan">questions[].text</span>
          <span class="spec-type text-magenta">string</span>
          <span class="spec-desc">Full question prompt text.</span>
        </div>
        <div class="spec-row">
          <span class="spec-field text-cyan">questions[].options</span>
          <span class="spec-type text-magenta">array (4 items)</span>
          <span class="spec-desc"><strong>Must have exactly 4 items</strong>, each with an <code class="code-inline">id</code> and <code class="code-inline">text</code>.</span>
        </div>
        <div class="spec-row">
          <span class="spec-field text-cyan">questions[].correctOptionId</span>
          <span class="spec-type text-magenta">string</span>
          <span class="spec-desc"><strong>Must match</strong> the <code class="code-inline">id</code> of one of the 4 items in the options array.</span>
        </div>
        <div class="spec-row">
          <span class="spec-field text-cyan">questions[].explanation</span>
          <span class="spec-type text-dim">string | null</span>
          <span class="spec-desc">Detailed explanation for the correct answer (displayed during post-submission review).</span>
        </div>
      </div>
    </div>

    <div class="ascii-rule text-dim">------------------------------------------------------------</div>

    <!-- Section: Sample JSON -->
    <div class="section">
      <div class="section-header-bar">
        <div class="section-title text-dim">
          <span class="text-cyan">//</span> 04. complete sample json template
        </div>
        <div class="action-bar">
          <button class="btn-cli" :class="{ 'btn-cli-active': jsonCopied }" @click="copyJson">
            {{ jsonCopied ? '[✓ copied to clipboard!]' : '[copy sample json]' }}
          </button>
          <button class="btn-cli" @click="downloadSampleJson">
            [↓ download .json template]
          </button>
        </div>
      </div>
      <div class="code-block-wrapper">
        <pre class="code-box"><code>{{ sampleJsonText }}</code></pre>
      </div>
    </div>

  </div>
</template>

<style scoped>
.guide-view {
  padding: var(--space-6) var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  width: 100%;
  max-width: 1200px;
  font-family: var(--font-mono);
}

.guide-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.header-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
}

.view-title {
  font-size: 16px;
  font-weight: 700;
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.view-sub {
  font-size: 13px;
  line-height: 1.6;
}

/* ASCII Rules */
.ascii-rule {
  font-size: 12px;
  opacity: 0.25;
  overflow: hidden;
  white-space: nowrap;
}

/* Sections */
.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.section-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.section-title {
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.section-hint {
  font-size: 13px;
  line-height: 1.6;
}

.action-bar {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  flex-wrap: wrap;
}

/* Workflow cards */
.workflow-steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}

.step-card {
  border-left: 2px solid var(--border-dim);
  padding: var(--space-3) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.step-card:hover {
  border-left-color: var(--ansi-cyan);
}

.step-num {
  font-size: 13px;
  font-weight: 700;
}

.step-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text);
}

.step-desc {
  font-size: 11px;
  line-height: 1.5;
}

/* Code blocks */
.code-block-wrapper {
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid var(--border-dim);
  padding: var(--space-4);
  overflow-x: auto;
}

.code-box {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.65;
  color: var(--color-text);
  white-space: pre-wrap;
  word-break: break-word;
}

.code-inline {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ansi-yellow);
  background: rgba(255, 255, 255, 0.05);
  padding: 1px 4px;
}

/* Spec table / grid */
.spec-grid {
  display: flex;
  flex-direction: column;
  gap: 1px;
  font-size: 12px;
}

.spec-row {
  display: grid;
  grid-template-columns: 220px 140px 1fr;
  gap: var(--space-4);
  padding: var(--space-2) var(--space-3);
  border-left: 2px solid transparent;
  align-items: baseline;
}

.spec-row:hover {
  border-left-color: var(--border-dim);
  background: rgba(255, 255, 255, 0.02);
}

.spec-field {
  font-weight: 700;
}

.spec-type {
  font-size: 11px;
}

.spec-desc {
  color: var(--color-text);
  line-height: 1.5;
}

/* Buttons */
.btn-cli {
  font-family: var(--font-mono);
  font-size: 12px;
  padding: 3px 10px;
  background: none;
  border: 1px solid var(--border-normal);
  color: var(--color-muted);
  cursor: pointer;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}

.btn-cli:hover {
  color: var(--ansi-cyan);
  border-color: var(--ansi-cyan);
}

.btn-cli-active {
  color: var(--ansi-green);
  border-color: var(--ansi-green);
}

.text-magenta { color: var(--ansi-magenta); }
.text-orange { color: var(--ansi-orange); }

@media (max-width: 900px) {
  .workflow-steps {
    grid-template-columns: repeat(2, 1fr);
  }
  .spec-row {
    grid-template-columns: 1fr;
    gap: var(--space-1);
  }
}
</style>
