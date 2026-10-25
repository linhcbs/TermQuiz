<script setup lang="ts">
// GuideView — AI Prompt and JSON Bank Format Guide
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTerminalLog } from '../services/terminalLog'

const router = useRouter()
const { ok } = useTerminalLog()

const promptCopied = ref(false)
const jsonCopied = ref(false)

const aiPromptText = `Bạn là một chuyên gia hỗ trợ chuyển đổi dữ liệu học tập. Tôi cần bạn chuyển đổi toàn bộ câu hỏi trắc nghiệm từ tài liệu đính kèm (hoặc hình ảnh/văn bản bên dưới) thành file JSON ngân hàng câu hỏi chuẩn cho ứng dụng TermQuiz.

QUY TẮC CẤU TRÚC JSON BẮT BUỘC (TUÂN THỦ 100%):
1. Cấu trúc tổng thể của file:
{
  "schemaVersion": 1,
  "id": "ma_ngan_hang_khong_dau",
  "title": "Tên Ngân Hàng Câu Hỏi / Tên Môn Học",
  "description": "Mô tả ngắn gọn về môn học hoặc đề cương ôn tập",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z",
  "questions": [ ... ]
}

2. Mỗi câu hỏi trong mảng "questions" BẮT BUỘC gồm các trường:
{
  "id": "q1",
  "type": "multiple-choice",
  "text": "Nội dung câu hỏi đầy đủ",
  "image": null,
  "options": [
    { "id": "q1_opt_a", "text": "Nội dung phương án A" },
    { "id": "q1_opt_b", "text": "Nội dung phương án B" },
    { "id": "q1_opt_c", "text": "Nội dung phương án C" },
    { "id": "q1_opt_d", "text": "Nội dung phương án D" }
  ],
  "correctOptionId": "q1_opt_a",
  "explanation": "Giải thích chi tiết ngắn gọn vì sao phương án này đúng."
}

3. CÁC QUY TẮC QUAN TRỌNG:
- Mỗi câu hỏi BẮT BUỘC PHẢI CÓ ĐỦ CHÍNH XÁC 4 LỰA CHỌN (mảng "options" có độ dài đúng bằng 4).
- "correctOptionId" PHẢI TRÙNG KHỚP với trường "id" của 1 trong 4 option tương ứng. Nếu tài liệu chưa có đáp án, hãy dùng tri thức chuyên môn để xác định đáp án đúng nhất.
- "id" của mỗi câu hỏi ("q1", "q2", ...) và "id" của các option ("q1_opt_a", "q1_opt_b", ...) là duy nhất, không trùng lặp.
- "type" luôn luôn là giá trị chuỗi "multiple-choice".
- "image" đặt là null (trừ khi có đường dẫn ảnh data:image).
- Giữ nguyên công thức toán học, thuật ngữ tiếng Anh hoặc đoạn code nguyên gốc trong "text" và "options".
- Trường "explanation" đưa ra lời giải thích súc tích, dễ hiểu.
- CHỈ TRẢ VỀ DUY NHẤT KHỐI MÃ JSON HỢP LỆ (bắt đầu bằng { và kết thúc bằng }), KHÔNG KÈM BẤT KỲ VĂN BẢN DẪN CHUYỆN HOẶC LỜI CHÀO NÀO BÊN NGOÀI.`

const sampleJsonText = `{
  "schemaVersion": 1,
  "id": "de_cuong_mau_2026",
  "title": "Đề Cương Mẫu Ôn Tập",
  "description": "Ngân hàng câu hỏi trắc nghiệm mẫu chuẩn định dạng TermQuiz",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z",
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "text": "Lệnh Git nào sau đây dùng để tạo nhánh mới và chuyển ngay sang nhánh đó?",
      "image": null,
      "options": [
        { "id": "q1_opt_a", "text": "git switch -c <branch-name>" },
        { "id": "q1_opt_b", "text": "git branch --new <branch-name>" },
        { "id": "q1_opt_c", "text": "git create <branch-name>" },
        { "id": "q1_opt_d", "text": "git commit -b <branch-name>" }
      ],
      "correctOptionId": "q1_opt_a",
      "explanation": "Lệnh 'git switch -c <name>' (hoặc 'git checkout -b <name>') tạo và chuyển ngay sang nhánh mới trong một thao tác."
    },
    {
      "id": "q2",
      "type": "multiple-choice",
      "text": "Trong kiến trúc web client-server, mã trạng thái HTTP 404 có ý nghĩa gì?",
      "image": null,
      "options": [
        { "id": "q2_opt_a", "text": "Bad Request - Yêu cầu không hợp lệ" },
        { "id": "q2_opt_b", "text": "Unauthorized - Chưa xác thực" },
        { "id": "q2_opt_c", "text": "Not Found - Không tìm thấy tài nguyên" },
        { "id": "q2_opt_d", "text": "Internal Server Error - Lỗi máy chủ nội bộ" }
      ],
      "correctOptionId": "q2_opt_c",
      "explanation": "Mã 404 Not Found biểu thị máy chủ không tìm thấy tài nguyên tương ứng với URL được yêu cầu."
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
          Hướng dẫn định dạng file .json ngân hàng câu hỏi &amp; Prompt mẫu cho AI (ChatGPT, Claude, Gemini, DeepSeek,...) để chuyển đổi từ đề cương PDF, Word hoặc Ảnh sang file JSON chuẩn.
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
        <span class="text-cyan">//</span> 01. quy trình thực hiện (workflow)
      </div>
      <div class="workflow-steps">
        <div class="step-card">
          <span class="step-num text-cyan">[01]</span>
          <div class="step-content">
            <span class="step-title">Copy Prompt Mẫu</span>
            <br/>
            <span class="step-desc text-dim">Nhấn nút copy prompt bên dưới để lấy câu lệnh chuẩn cho AI.</span>
          </div>
        </div>
        <div class="step-card">
          <span class="step-num text-green">[02]</span>
          <div class="step-content">
            <span class="step-title">Gửi Tài Liệu Cho AI</span>
            <br/>

            <span class="step-desc text-dim">Mở ChatGPT, Claude, Gemini hoặc DeepSeek. Đính kèm file PDF/Word/Ảnh đề cương và dán prompt.</span>
          </div>
        </div>
        <div class="step-card">
          <span class="step-num text-magenta">[03]</span>
          <div class="step-content">
            <span class="step-title">Lưu File .json</span>
            <br/>

            <span class="step-desc text-dim">Copy khối mã JSON mà AI trả về và lưu thành file có đuôi <code class="code-inline">.json</code>.</span>
          </div>
        </div>
        <div class="step-card">
          <span class="step-num text-orange">[04]</span>
          <div class="step-content">
            <span class="step-title">Import &amp; Luyện Tập</span>
            <br/>

            <span class="step-desc text-dim">Vào tab Question Banks, click nút <strong>↓ import</strong> và bắt đầu làm bài trắc nghiệm ngay!</span>
          </div>
        </div>
      </div>
    </div>

    <div class="ascii-rule text-dim">------------------------------------------------------------</div>

    <!-- Section: AI Prompt -->
    <div class="section">
      <div class="section-header-bar">
        <div class="section-title text-dim">
          <span class="text-cyan">//</span> 02. prompt mẫu đưa cho ai (chatgpt / claude / gemini / deepseek)
        </div>
        <div class="action-bar">
          <button class="btn-cli" :class="{ 'btn-cli-active': promptCopied }" @click="copyPrompt">
            {{ promptCopied ? '[✓ copied to clipboard!]' : '[copy prompt]' }}
          </button>
        </div>
      </div>
      <p class="section-hint text-dim">
        Prompt này đã được tối ưu để yêu cầu AI đọc tài liệu (PDF, Word, Ảnh), trích xuất từng câu hỏi, tự sinh lời giải thích (explanation), tạo đúng 4 phương án và xuất ra file JSON chuẩn 100%.
      </p>
      <div class="code-block-wrapper">
        <pre class="code-box"><code>{{ aiPromptText }}</code></pre>
      </div>
    </div>

    <div class="ascii-rule text-dim">------------------------------------------------------------</div>

    <!-- Section: JSON Specification -->
    <div class="section">
      <div class="section-title text-dim">
        <span class="text-cyan">//</span> 03. chi tiết các trường dữ liệu trong file .json
      </div>
      <div class="spec-grid">
        <div class="spec-row">
          <span class="spec-field text-cyan">schemaVersion</span>
          <span class="spec-type text-magenta">number</span>
          <span class="spec-desc">Bắt buộc là <code class="code-inline">1</code>.</span>
        </div>
        <div class="spec-row">
          <span class="spec-field text-cyan">id</span>
          <span class="spec-type text-magenta">string</span>
          <span class="spec-desc">Mã định danh ngân hàng câu hỏi, không dấu, ví dụ: <code class="code-inline">"toan_cao_cap"</code>.</span>
        </div>
        <div class="spec-row">
          <span class="spec-field text-cyan">title</span>
          <span class="spec-type text-magenta">string</span>
          <span class="spec-desc">Tên hiển thị của ngân hàng câu hỏi (ví dụ: <code class="code-inline">"Lịch Sử Đảng"</code>).</span>
        </div>
        <div class="spec-row">
          <span class="spec-field text-cyan">description</span>
          <span class="spec-type text-dim">string</span>
          <span class="spec-desc">Mô tả ngắn gọn về ngân hàng câu hỏi (tùy chọn).</span>
        </div>
        <div class="spec-row">
          <span class="spec-field text-cyan">createdAt / updatedAt</span>
          <span class="spec-type text-dim">string</span>
          <span class="spec-desc">Chuỗi thời gian chuẩn ISO 8601 (ví dụ: <code class="code-inline">"2026-01-01T00:00:00.000Z"</code>).</span>
        </div>
        <div class="spec-row">
          <span class="spec-field text-cyan">questions</span>
          <span class="spec-type text-magenta">array</span>
          <span class="spec-desc">Mảng danh sách các câu hỏi trắc nghiệm.</span>
        </div>
        <div class="spec-row">
          <span class="spec-field text-cyan">questions[].id</span>
          <span class="spec-type text-magenta">string</span>
          <span class="spec-desc">Mã duy nhất của câu hỏi (ví dụ: <code class="code-inline">"q1"</code>, <code class="code-inline">"q2"</code>).</span>
        </div>
        <div class="spec-row">
          <span class="spec-field text-cyan">questions[].type</span>
          <span class="spec-type text-magenta">string</span>
          <span class="spec-desc">Luôn là chuỗi <code class="code-inline">"multiple-choice"</code>.</span>
        </div>
        <div class="spec-row">
          <span class="spec-field text-cyan">questions[].text</span>
          <span class="spec-type text-magenta">string</span>
          <span class="spec-desc">Nội dung đầy đủ của câu hỏi.</span>
        </div>
        <div class="spec-row">
          <span class="spec-field text-cyan">questions[].options</span>
          <span class="spec-type text-magenta">array (4 items)</span>
          <span class="spec-desc"><strong>Bắt buộc đúng 4 phần tử</strong>, mỗi phần tử gồm <code class="code-inline">id</code> và <code class="code-inline">text</code>.</span>
        </div>
        <div class="spec-row">
          <span class="spec-field text-cyan">questions[].correctOptionId</span>
          <span class="spec-type text-magenta">string</span>
          <span class="spec-desc"><strong>Bắt buộc trùng khớp</strong> với trường <code class="code-inline">id</code> của một trong 4 phương án trong options.</span>
        </div>
        <div class="spec-row">
          <span class="spec-field text-cyan">questions[].explanation</span>
          <span class="spec-type text-dim">string | null</span>
          <span class="spec-desc">Lời giải thích chi tiết đáp án đúng (hiển thị cho người học sau khi nộp bài).</span>
        </div>
      </div>
    </div>

    <div class="ascii-rule text-dim">------------------------------------------------------------</div>

    <!-- Section: Sample JSON -->
    <div class="section">
      <div class="section-header-bar">
        <div class="section-title text-dim">
          <span class="text-cyan">//</span> 04. file .json mẫu hoàn chỉnh (sample template)
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
