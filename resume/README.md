# Resume

基于 [JSON Resume](https://jsonresume.org/) 标准的简历管理系统。

## 文件说明

```
resume/
├── resume.json                          # 通用版简历 (推送到 jsonresume.org)
├── resume-ubc-cel-coordinator.json      # UBC CEL Coordinator 定制版
├── resume-melotech.json                 # Melotech 定制版
├── resume-photon.json                   # Photon 定制版
├── resume-vpl-library-assistant.json    # Vancouver Public Library 定制版
├── out-ubc-cel-coordinator.html         # 渲染输出
├── out-vpl-library-assistant.html       # 渲染输出
├── README.md                            # 本文件
├── package.json
└── node_modules/
```

## 工具链

| 工具 | 用途 |
|------|------|
| [resumed](https://github.com/rbard/resumed) | JSON Resume CLI — 渲染/导出 |
| [@jsonresume/jsonresume-theme-consultant-polished](https://www.npmjs.com/package/@jsonresume/jsonresume-theme-consultant-polished) | 主题 — 咨询/叙事风格 |
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

### 导出 PDF

本机用 **Helium**（Chromium 内核浏览器，位于 `/Applications/Helium.app`）驱动 Puppeteer 导出。
`resumed export` CLI 的 `--puppeteer-arg` 解析有 bug（会报 `TypeError: s.startsWith is not a function`），
所以直接用 Puppeteer API。推荐用仓库里的脚本：

```bash
cd resume
node render-pdf.mjs        # 读取 out-vpl-library-assistant.html，注入紧凑打印 CSS，导出 2 页 PDF
```

> **两页控制**：`render-pdf.mjs` 会注入一段 `@media print` 紧凑 CSS（字号 13px、收紧行距/段距），
> 确保 VPL 版简历稳定落在 2 页以内。其余版本若不需要压缩，可去掉脚本里的 `COMPACT` 注入。

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
- 定制版简历（如 `resume-ubc-cel-coordinator.json`）不会触发

## 命名规范

```
resume-{target-role-slug}.json  ← 定制版（不推送）
resume.json                     ← 通用版（推送到 registry）
```

## 两种简历的区别

| 文件 | 用途 | 推送 |
|------|------|------|
| `resume.json` | 通用版，覆盖全貌 | ✅ 推送到 jsonresume.org |
| `resume-*.json` | 针对特定 JD 定制 | ❌ 仅本地 |

通用版保持中立、全面，不偏向任何单一岗位。定制版从通用版复制后修改。
