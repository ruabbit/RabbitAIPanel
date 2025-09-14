# Header Controls（面板顶栏控件）

本页记录 /admin 与 /dashboard 顶部区域的按键与功能及调试开关的行为规范。

## 旧版（全局 Navbar）
- 左侧：
  - 菜单键（仅窄屏显示）：控制侧栏开关
  - 品牌：RabbitRelay（原 Rabbit Panel）
- 中间导航：
  - 链接：用户后台（/dashboard）、管理后台（/admin）
- 右侧：
  - “配置”按钮（FiSettings）：打开开发配置（DEV_API_KEY、x-dev-user-id、社交提供方），存入 localStorage
  - “使用社交登录”（FiLogIn）：调用 `startSocialLogin(provider)` 并跳转

## 新版（Application UI 框架 AppFrame）
- 左侧：
  - 菜单键（移动端抽屉）
  - 左侧固定侧栏（桌面）：应用导航
- 顶栏右侧（受 Debug 开关控制，见下文）：
  - “配置”按钮（FiSettings）：打开 `DevSettingsModal`
    - API 基址：localStorage.`api_base`（仅在 Debug=ON 时生效，覆盖 .env `VITE_API_BASE`）
    - DEV_API_KEY：localStorage.`dev_api_key`（Debug=ON 生效）
    - x-dev-user-id：localStorage.`dev_user_id`（Debug=ON 生效）
    - 社交提供方：localStorage.`social_provider`（Debug=ON 生效）
  - “使用社交登录”（FiLogIn）：未登录时显示；Debug=ON 时始终显示，文案为“社交登录测试”
  - 通知铃铛（FiBell）与用户菜单占位（可后续接入）
  - API 基址指示与“未设置 API 基址”黄条：仅在 Debug=ON 时展示

## 实现位置
- 组件：`src/components/AppFrame.jsx` 顶栏右侧新增两个按钮（配置/社交登录）
- 弹窗：`src/components/DevSettingsModal.jsx`（DEV_API_KEY、x-dev-user-id、社交 provider）
- 登录：`utils/api.startSocialLogin`（沿用旧版）

## 调试开关与显示逻辑
- 开关变量：`VITE_DEBUG`
- Debug=OFF（默认/生产）：
  - 顶栏不显示“配置”与 API 指示；“未设置 API 基址”提示不显示
  - DevSettings 中的所有覆盖值不生效（不会写入请求头/基址）
  - 社交登录按钮仅在“未登录”时显示
- Debug=ON（开发调试）：
  - 顶栏显示“配置”与 API 指示；未设置 API 时显示黄条提示
  - DevSettings 覆盖值生效（请求附带 dev headers；基址可被 localStorage 覆盖）
  - 社交登录按钮始终显示，文案“社交登录测试”

启用方式：推荐使用 npm script（无需手改 `.env`）
- `npm run dev:debug` 或 `npm run dev:debug:host`

（可选）启动时将 `.env` 中的 `VITE_API_BASE` 写回到 localStorage（排查注入问题）：
- `npm run dev:debug:writeenv`

## 页面迁移清单（用户侧）
- 概览（/dashboard/overview）
  - 默认使用当前用户（来自“开发配置”的 `x-dev-user-id`，仅 Debug=ON 有效），不再要求手动输入
  - 移除“更改用户ID”等开发选项，用户侧界面符合生产标准

- 账期汇总（/dashboard/period）
  - 默认绑定当前用户；保留日期与 group_by（下拉为 combobox 风格）
  - 导出 CSV 使用相同 userId 绑定

- 每日汇总（/dashboard/daily）
  - 默认绑定当前用户；保留 date 输入

- 近 N 日汇总（/dashboard/summary）
  - 默认绑定当前用户；保留 days 输入

- 钱包（/dashboard/wallets）
  - 默认绑定当前用户；加载钱包列表

- 流水（/dashboard/ledger）
  - 默认绑定当前用户；加载流水表格

- 代理测试（/dashboard/proxy）
  - 显示当前用户；x-litellm-api-key 仍可在页面输入

备注：当前用户、API Key、Provider 通过 DevSettingsModal 维护（localStorage），但仅在 Debug=ON 时生效。
