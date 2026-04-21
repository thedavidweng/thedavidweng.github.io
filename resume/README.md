# Resume

基于 [JSON Resume](https://jsonresume.org/) 标准的简历管理系统。

## 文件说明

```
resume/
├── resume.json                          # 通用版简历 (推送到 jsonresume.org)
├── resume-ubc-cel-coordinator.json      # UBC CEL Coordinator 定制版
├── out-ubc-cel-coordinator.html         # 渲染输出
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
npm install
```

### 渲染 HTML

```bash
npx resumed render "resume.json" \
  -t @jsonresume/jsonresume-theme-consultant-polished \
  -o out.html
```

### 导出 PDF

```bash
npx resumed export "resume.json" \
  -t @jsonresume/jsonresume-theme-consultant-polished \
  -o david-weng-resume.pdf
```

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
