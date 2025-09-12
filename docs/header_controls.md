# Header Controls (旧版与新版迁移对照)

本页记录 /admin 与 /dashboard 顶部区域的按键与功能，确保迁移不遗漏。

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
- 顶栏右侧：
  - “配置”按钮（FiSettings）：打开 `DevSettingsModal`，内容与旧版一致，读写相同 localStorage 键
  - “使用社交登录”（FiLogIn）：同旧版逻辑
  - 通知铃铛（FiBell）与用户菜单占位（可后续接入）

## 实现位置
- 组件：`src/components/AppFrame.jsx` 顶栏右侧新增两个按钮（配置/社交登录）
- 弹窗：`src/components/DevSettingsModal.jsx`（DEV_API_KEY、x-dev-user-id、社交 provider）
- 登录：`utils/api.startSocialLogin`（沿用旧版）

## 迁移注意事项
- /admin 与 /dashboard 路由下，隐藏全局 Navbar/Footer（由 AppFrame 负责顶栏与侧栏）
- 页面内部继续使用 Primer 控件：Button/Container/SectionHeading

## 页面迁移清单（用户侧）
- 概览（/dashboard/overview）
  - 默认使用当前用户（localStorage.dev_user_id），不再要求手动输入
  - 提供“更改用户ID”高级开关（可选），避免主流程被打扰
  - 使用 Button/Container/SectionHeading 布局

- 账期汇总（/dashboard/period）
  - 同上：默认绑定当前用户；保留日期与 group_by
  - 导出 CSV 使用相同 userId 绑定

- 每日汇总（/dashboard/daily）
  - 同上：默认绑定当前用户；保留 date 输入

- 近 N 日汇总（/dashboard/summary）
  - 同上：默认绑定当前用户；保留 days 输入

- 钱包（/dashboard/wallets）
  - 同上：默认绑定当前用户；加载钱包列表

- 流水（/dashboard/ledger）
  - 同上：默认绑定当前用户；加载流水表格

- 代理测试（/dashboard/proxy）
  - 显示当前用户；x-litellm-api-key 仍可在页面输入

备注：当前用户、API Key、Provider 通过 DevSettingsModal 维护（localStorage）。
