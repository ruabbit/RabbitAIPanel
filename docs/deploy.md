# 部署手册（Debian 13，本地 Demo，无真实凭据）

本文档记录在一台全新 Debian 13 服务器（示例：100.110.0.229）上部署本系统 Demo 的步骤。所有步骤均可直接复制执行；每成功一小步即可在此文档勾选完成。

## 0. 前置信息

- 目标：本地 Demo（不配置真实 Logto/Stripe 凭据），跑通后端 API 与前端页面，数据库使用 Docker 中的 Postgres。
- 系统：Debian 13（trixie）。
- 目录规划：
  - 后端与前端代码：`/opt/mw`
  - Python 虚拟环境：`/opt/mw/.venv`
  - 环境变量文件（后端）：`/opt/mw/.env`
  - Docker Compose（数据库）：`/opt/mw/deploy/docker-compose.yml`

## 1. 基础环境安装（一次性）

```bash
sudo apt update -y
sudo apt install -y ca-certificates curl gnupg lsb-release git build-essential python3-venv python3-pip python3-dev
```

### 1.1 安装 Node.js LTS（Node 20）

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### 1.2 安装 Docker Engine（用于数据库容器）

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update -y
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER   # 可选，允许当前用户无需 sudo 运行 docker
```

## 2. 拉取代码与准备目录

```bash
sudo mkdir -p /opt/mw
sudo chown -R $USER:$USER /opt/mw
cd /opt/mw

# 方式 A：git clone（推荐）
# git clone <your-repo-url> .

# 方式 B：将本地代码打包上传（scp/rsync），并解压到 /opt/mw
```

确认项目根目录存在：`api/`、`middleware/`、`frontend/`、`requirements.txt`、`deploy/docker-compose.yml` 等。

## 3. 启动数据库（Postgres via Docker）

```bash
cd /opt/mw/deploy
docker compose up -d
docker ps  # 查看 mw_postgres 是否 healthy
```

默认数据库信息：
- 地址：`localhost:5432`
- DB：`appdb`
- 用户/密码：`app/app`

## 4. 配置后端环境 & 运行后端

### 4.1 准备虚拟环境与依赖

```bash
cd /opt/mw
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 4.2 环境变量（.env）

创建 `/opt/mw/.env`：

```bash
cat >/opt/mw/.env <<'EOF'
# 基础数据库（Docker Postgres）
DATABASE_URL=postgresql+psycopg2://app:app@localhost:5432/appdb

# 开发鉴权（前端开发配置里填写同样的 DEV_API_KEY 与 x-dev-user-id）
DEV_API_KEY=dev_123456

# 可选开关（保持默认）
RATE_LIMIT_ENABLED=1
OVERDRAFT_GATING_ENABLED=0
LITELLM_SYNC_ENABLED=0

# Logto/Stripe（演示期为空即可）
LOGTO_ENDPOINT=
LOGTO_CLIENT_ID=
LOGTO_CLIENT_SECRET=
LOGTO_REDIRECT_URI=http://localhost:8000/auth/social/callback
LOGTO_MGMT_CLIENT_ID=
LOGTO_MGMT_CLIENT_SECRET=
LOGTO_MGMT_RESOURCE=
CONNECTOR_GOOGLE_ID=
CONNECTOR_GITHUB_ID=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLISHABLE_KEY=
EOF
```

### 4.3 运行后端（开发模式）

```bash
cd /opt/mw
source .venv/bin/activate
export $(grep -v '^#' .env | xargs)
uvicorn api.server:app --host 0.0.0.0 --port 8000
```

打开另一个终端验证健康检查：

```bash
curl -i http://127.0.0.1:8000/healthz
```

（可选）生产建议使用 systemd 创建服务 `middleware.service`，此处略。

## 5. 构建与运行前端

### 5.1 配置前端 API 基址（很重要）

创建 `frontend/.env`：

```bash
cat >/opt/mw/frontend/.env <<'EOF'
# 若从本机浏览器访问服务器，请使用服务器对外 IP + 8000 端口
# 例如：VITE_API_BASE=http://100.110.0.229:8000
VITE_API_BASE=http://100.110.0.229:8000
EOF
```

### 5.2 安装依赖并构建

```bash
cd /opt/mw/frontend
npm install
npm run build
npm run preview -- --host 0.0.0.0 --port 5173
```

前端预览默认监听 5173 端口。浏览器访问：`http://<服务器IP>:5173/`（首页、用户后台、管理后台都有左侧导航的多页布局）。

注意：不要直接访问 `http://<服务器IP>:5173/v1/...` 这样的路径，这会命中前端静态服务器的单页路由返回空白页。所有 API 请求将由前端调用 `VITE_API_BASE` 指向的后端地址（如 `http://<服务器IP>:8000`）。

（可选）开发阶段也可以使用 Vite 开发服务器代理（非 preview 模式）：

```bash
# 编辑 frontend/vite.config.js，取消 proxy 中 '/v1' 与 '/auth' 的注释
npm run dev
# 然后访问 http://<服务器IP>:5173/，前端对 /v1 与 /auth 的请求会被代理到后端 8000 端口
```

（可选）生产可用 Nginx/ Caddy 提供静态站点，以及反向代理到后端 8000 端口。

### 5.3 Debug 与启动时回写（可选）

无需修改 `frontend/.env` 也可通过 npm scripts 开启调试与写回：

```bash
# 仅开启 Debug（显示“配置”与 API 指示，Dev 覆盖生效）
npm run dev:debug:host

# 同时开启 Debug + 写入 .env 文件（若 .env 不存在会：优先复制 env.bak；否则根据当前环境变量生成）
npm run dev:debug:writeenv -- --host 0.0.0.0 --port 5173
```

说明：
- Debug=ON 时才会读取 “开发配置” 中的覆盖（api_base、dev_api_key、x-dev-user-id 等）。
- 写入 .env 的行为默认关闭；只有使用 `dev:writeenv` 或 `dev:debug:writeenv` 时触发。
- 写入逻辑（仅当 `.env` 不存在时）：
  1) 若存在 `env.bak` 或 `.env.bak`，复制为 `.env`；
  2) 否则根据当前进程环境变量写入（例如已导出 `VITE_API_BASE` / `VITE_DEBUG`）。

## 6. 本地 Demo 验证

1) Navbar“配置”中填写：
- DEV_API_KEY: 与后端 `.env` 中一致（如 `dev_123456`）
- x-dev-user-id: 例如 `1`

2) 用户后台（/dashboard）：
- 输入 user_id=1，点击“加载预算总览”、“加载账期汇总”等按钮查看数据（首次启动数据库为空为正常）。

3) 管理后台（/admin）：
- 可使用“计划管理（测试）”创建 Plan → Upsert 日限额/用量 → 添加计价规则 → 分配 Plan → 查询 Plan
- 价格映射 CRUD、订阅/发票生成与推送（无 Stripe 凭据时推送可能报错，属预期）

4) 代理测试（/proxy）：
- 输入上游 `x-litellm-api-key` 与 `model`、消息文本，调用 `/v1/proxy/chat/completions` 观察返回。

## 7. 故障排查

- 端口占用：确保 8000（后端）、5173（前端 preview）、5432（Postgres）未被占用。
- 数据库连接：若无法连接 Postgres，检查 `docker ps` 与 `DATABASE_URL`。
- 权限问题：确保 `/opt/mw` 目录属当前用户；venv 使用相同用户创建。
- 日志：后端日志包含 `x-request-id`，有助于排错；返回头也会带 `x-request-id`。

## 8. 后续（真测与生产）

- Logto：提供 tenant 与 client/secret、connector_target_id 后，后端会打通社交绑定与资料回填完整链路。
- Stripe：提供 secret key/webhook secret 后，可测试 ensure、推送发票与回调处理。
- 生产化：使用 systemd/Nginx/Caddy、TLS、集中式限流（Redis/网关）、Docker 化后端等。
