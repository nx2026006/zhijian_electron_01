# nowCreate-electron

基于 Electron + Vue 3 的桌面图片压缩工具，支持批量导入、自定义质量压缩、CDN 直传和结果导出。

## 功能特性

- **批量压缩**：支持多图片导入，拖拽添加，并发处理
- **质量控制**：轻度（90）/ 中度（75）/ 深度（50）+ 自定义（10-100）
- **实时进度**：每张图片独立进度条，处理状态即时反馈
- **结果对比**：压缩前后大小对比，压缩率可视化
- **文件导出**：覆盖原文件或导出到指定目录
- **Token 管理**：启动自动加载，缺失时弹窗引导配置

## 环境要求

| 依赖 | 版本 |
|------|------|
| Node.js | >= 18 |
| Yarn | 1.22+ |
| Electron | 28+（内嵌 Node v20.18.0） |

## 快速开始

```bash
# 安装依赖
yarn install

# 启动开发环境
yarn dev

# 生产构建
yarn build
```

## 配置 API Key

在项目根目录创建 `.env` 文件：

```env
NX_API_KEY=你的API密钥
```

启动后系统自动读取。若未配置，点击"开始压缩"时会弹出输入框，填写后自动写入 `.env`。

### 获取 Key

请联系微信 **zhijian_2026**。

## 项目结构

```
nowCreate-electron/
├── electron.vite.config.mjs       # electron-vite 构建配置
├── scripts/
│   └── start-dev.js               # 开发启动封装（自动清理环境变量）
├── src/main/                      # Electron 主进程
│   └── index.js                   # 入口（窗口创建、IPC 注册、Token 管理）
├── src/preload/
│   └── index.js                   # contextBridge 暴露 window.electron
├── src/renderer/                  # Vue 3 渲染进程
│   ├── index.html                 # Vite 入口 HTML
│   └── src/
│       ├── main.js                # Vue 根实例创建
│       ├── App.vue                # 根组件
│       ├── router/index.js        # 路由（hash 模式）
│       ├── stores/index.js        # Pinia 状态管理（项目/UI/Token）
│       ├── api/
│       │   ├── index.js           # Axios 实例 + 拦截器 + 队列
│       │   ├── config.js          # API 常量（地址、超时、渠道）
│       │   └── modules/
│       │       └── compress.js    # 压缩接口
│       ├── composables/
│       │   └── useImageImport.js  # 图片导入逻辑
│       ├── components/
│       │   ├── layout/index.vue   # 主布局
│       │   ├── canvas/index.vue   # 画布区域
│       │   ├── chat/index.vue     # AI 聊天面板
│       │   └── workspace/         # 工作区公用组件
│       ├── views/
│       │   ├── home/index.vue     # 首页
│       │   └── workspace/
│       │       ├── compress.vue   # 压缩工作区
│       │       └── about.vue      # 关于页
│       ├── assets/
│       │   ├── css/               # 全局样式 + SCSS 变量
│       │   └── images/            # 图片资源
│       └── utils/                 # 工具函数
└── resources/                     # 打包资源（图标等）
```

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Electron | ^28 | 桌面框架 |
| electron-vite | ^2 | 构建工具 |
| Vue 3 | ^3.4 | 渲染框架 |
| Element Plus | ^2.7 | UI 组件库 |
| Pinia | ^2.1 | 状态管理 |
| Vue Router | ^4.3 | 路由（Hash 模式） |
| Axios | latest | HTTP 请求 |
| Sass | ~1.77 | CSS 预处理 |

## 架构

```
渲染进程                     主进程                      外部服务
┌──────────┐   IPC    ┌──────────────┐   HTTP    ┌──────────────┐
│ Vue 3    │◄───────►│ ipcMain       │◄────────►│ 压缩 API      │
│ 压缩面板  │         │ 文件读写       │          │              │
│          │         │ Token 管理     │          │              │
│          │         │ 窗口控制       │          │              │
└──────────┘         └──────────────┘          └──────────────┘
```

## 压缩流程

1. 导入图片（按钮/拖拽/文件夹）→ 显示缩略图列表
2. 选择压缩质量和方式
3. 点击"开始压缩" → 预检第一批 → 通过后并发压缩剩余批次
4. 每张图片独立显示进度条（0 → ~90% → 100%）
5. 完成后可选择覆盖原文件或导出到新目录

## 启动注意事项

- **`ELECTRON_RUN_AS_NODE=1` 系统环境变量**：存在时 Electron 无法正常启动，`yarn dev` 已通过 `scripts/start-dev.js` 自动清除该变量
- **sass 版本**：固定 `~1.77.0`，1.80+ 要求 Node >= 20.19
- **构建输出**：`out/` 目录，分 `main` / `preload` / `renderer` 三部分
- **单实例锁**：重复启动会激活已有窗口而非创建新窗口

## 联系方式

- API Key 获取：微信 **zhijian_2026**
- 技术支持：微信 **zhijian_2026**
