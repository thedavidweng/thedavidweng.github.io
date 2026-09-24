# Resume

基于 [JSON Resume](https://jsonresume.org/) 标准的简历管理系统。

## 工作流：只追踪主简历

- `resume.json` 是唯一的 source of truth：中立、全貌，包含所有经历模块。**任何新经历先加进这里**，再考虑针对岗位怎么裁剪。
- 针对具体 JD 的定制版**不提交到仓库**：从主简历复制一份 → 按 JD 定制 → 渲染投递，用完即弃。如需回溯，从 git 历史找回或重新生成。
- 只有 `resume.json` 被修改时才会触发 Gist 同步（`jsonresume.org/thedavidweng` 自动刷新）。

## 定制手法

针对 JD 的常规操作，配合仓库 `.agents/skills/` 里的 agent 流水线
（`job-description-analyzer` → `resume-tailor` → `resume-ats-optimizer` → `interview-prep-generator`）：

1. 重写 `basics.label` 和 `basics.summary` 定调。Tech 岗保持 "Product Engineer & Creative Technologist" 身份，只做小幅适配；转行 / 服务类岗可整体改写。
2. `work` 按相关性重排或删减，不相关的经历直接拿掉；保留经历的 highlights 换措辞贴 JD 关键词。
3. `projects` 按岗位增删：tech 岗保留，服务类岗可全删。
4. `skills` 整个分类体系按岗位重建，不只是加减关键词。
5. `volunteer`：tech 岗删，社区 / 服务岗保留。
6. `education` 保持不动。

原则：只 highlight 真实经历，不编造（见 `resume-tailor` skill 的 Tailoring Philosophy）。

## 文件说明

```
resume/
├── resume.json        # 主简历（唯一追踪版本，推送到 registry）
├── README.md          # 本文件
├── package.json
├── pnpm-lock.yaml
└── render-pdf.mjs     # HTML → PDF，注入紧凑打印 CSS 控制页数
```

`out-*.html` 为渲染中间产物，已在 `.gitignore` 中忽略，不提交。

## 工具链

| 工具 | 用途 |
|------|------|
| [resumed](https://github.com/rbard/resumed) | JSON Resume CLI — 渲染/导出 |
| [@jsonresume/jsonresume-theme-consultant-polished](https://www.npmjs.com/npm/package/@jsonresume/jsonresume-theme-consultant-polished) | 主题 — 咨询/叙事风格 |
| [JSON Resume Registry](https://registry.jsonresume.org/) | 在线托管 |
| GitHub Actions (gist.yml) | 自动同步到 Gist |

## 使用方法

### 安装依赖

```bash
cd resume
pnpm install
```

### 渲染 HTML

```bash
npx resumed render "resume.json" \
  -t @jsonresume/jsonresume-theme-consultant-polished/dist \
  -o out.html
```

> 注意：主题的默认 export 指向 JSX 源码（`src/index.jsx`），在较新版本 Node 下无法直接加载；
> 请使用 `/dist` 子路径指向已构建的 `dist/index.js`。

### 定制一版简历（不提交）

```bash
cd resume
cp resume.json /tmp/resume-target.json
# 按 JD 修改 /tmp/resume-target.json（可走 .agents/skills 流水线让 agent 做）
npx resumed render /tmp/resume-target.json \
  -t @jsonresume/jsonresume-theme-consultant-polished/dist \
  -o out.html
node render-pdf.mjs out.html David_Weng_Resume.pdf
```

### 导出 PDF

本机用 **Helium**（Chromium 内核浏览器，位于 `/Applications/Helium.app`）驱动 Puppeteer 导出。
`resumed export` CLI 的 `--puppeteer-arg` 解析有 bug（会报 `TypeError: s.startsWith is not a function`），
所以直接用 Puppeteer API。推荐用仓库里的脚本：

```bash
cd resume
node render-pdf.mjs out.html David_Weng_Resume.pdf
```

> **页数控制**：`render-pdf.mjs` 会注入一段 `@media print` 紧凑 CSS（字号 13px、收紧行距/段距），
> 让简历稳定落在 2 页以内。若不需要压缩，可去掉脚本里的 `COMPACT` 注入。

> `resumed export` 需要本机装有 Puppeteer 可驱动的浏览器（Chrome/Chromium）。若无浏览器，
> 可安装 Helium，或在 Chrome 中打开渲染后的 HTML 用「打印 → 另存为 PDF」代替。

## 自动推送到 jsonresume.org

### 工作原理

```
push resume/resume.json
  → GitHub Actions (gist.yml)
    → 更新 Gist (1350e3f706b7d5cb822e2ef251a5ec6b)
      → jsonresume.org/thedavidweng 自动刷新
```

### 设置步骤

1. **创建 GitHub Personal Access Token**
   - 前往 GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
   - 权限: 只需勾选 **Gists → Read and write**
   - 复制 token

2. **添加 Repository Secret**
   - 前往 thedavidweng/thedavidweng → Settings → Secrets and variables → Actions
   - New repository secret
   - Name: `TOKEN`
   - Value: 粘贴上一步的 token

3. **确认 Gist ID**
   - 当前 gist: `1350e3f706b7d5cb822e2ef251a5ec6b`
   - 推送后访问: https://registry.jsonresume.org/thedavidweng

### 触发条件

- 只有 `resume/resume.json` 被修改时才会触发
