# Baby Companion

只面向家人使用的宝宝成长陪伴微信小程序。仓库采用 pnpm workspace Monorepo，同时管理 UniApp 小程序、NestJS API 和前后端共享契约。

## 项目结构

```text
baby-companion/
├── apps/
│   ├── miniapp/              # UniApp + Vue 3 微信小程序
│   └── api/                  # NestJS + Prisma API
├── packages/
│   └── contracts/            # 前后端共享 TypeScript 契约
├── docker/mysql/init/        # 本地 MySQL 初始化脚本
├── docs/phase-1/             # 信息架构、ER 图和接口清单
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json
```

## 当前能力

### 小程序

- 微信登录、开发登录回退、令牌持久化与 401 自动刷新
- 独立温馨首页：无家庭显示创建/加入入口，有家庭显示宝宝与家庭摘要
- 启动恢复与家庭上下文判断，所有正常用户统一进入首页
- 首次创建家庭和宝宝档案
- 管理员生成 7 天邀请码，家人输入邀请码后立即加入
- 宝宝概览和按类型、月份筛选的成长时间线
- 文字与图片成长记录的新增、详情、编辑和删除
- 宝宝档案、家庭信息与本地深色模式
- 成长记录模块使用可持久化 Mock 数据，支持一键恢复演示内容

### API

- NestJS 11 应用骨架与统一 `/api/v1` 前缀
- 统一成功响应、错误码、Request ID、Swagger 文档与全局 DTO 校验
- Prisma 7 + MySQL/MariaDB 驱动适配器
- 阶段一完整 Prisma 数据模型和首个 migration
- MySQL 8.4 Docker Compose 与独立 shadow database
- 存活、数据库就绪健康检查
- 可重复执行的本地种子数据
- 微信 `code2Session` 登录与仅开发环境可用的模拟登录
- 短期 Access Token、Refresh Token 轮换、复用检测与会话撤销
- `/me`、`/bootstrap` 和幂等的 `/onboarding` 接口
- 家庭邀请码摘要存储、旧码撤销、管理员鉴权与单家庭事务约束

> 当前采用混合数据模式：认证、启动上下文、家庭与宝宝初始化使用真实 API；成长记录 CRUD 暂时使用 Mock，下一阶段再迁移到数据库接口。

## 环境要求

- Node.js `>= 20.19`
- pnpm `>= 10`
- Docker Desktop
- 微信开发者工具

## 首次启动

安装依赖：

```bash
pnpm install
```

启动 MySQL、应用迁移并写入演示数据：

```bash
pnpm db:up
pnpm db:migrate
pnpm db:seed
```

启动 NestJS API：

```bash
pnpm dev:api
```

- API：`http://localhost:3000/api/v1`
- Swagger：`http://localhost:3000/docs`
- 健康检查：`http://localhost:3000/api/v1/health/ready`

本地开发默认启用模拟微信身份。小程序读取 `apps/miniapp/.env`：

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:3000/api/v1
VITE_USE_DEV_LOGIN=true
```

后端的 `/auth/dev-login` 仅在 `NODE_ENV=development` 时存在，生产环境不会开放。

另开一个终端启动微信小程序构建监听：

```bash
pnpm dev:miniapp
```

然后使用微信开发者工具导入：

```text
apps/miniapp/dist/dev/mp-weixin
```

首次打开会自动模拟登录并进入首页。如果数据库中没有该用户的家庭关系，首页会同时显示“创建家庭”和“使用邀请码加入”。

### 单设备演示邀请加入

1. 使用“小舅舅”身份创建家庭。
2. 进入“我的 → 家庭信息”，生成并复制邀请码。
3. 进入“我的 → 切换演示身份”，选择“家人（邀请加入者）”。
4. 回到首页，选择“使用邀请码加入”，粘贴邀请码。
5. 加入成功后，两个开发身份会看到同一个家庭和宝宝。

“切换演示身份”只会在本地开发登录模式出现，不会进入真实微信生产流程。

H5 快速预览：

```bash
pnpm dev:h5
```

## 常用工程命令

```bash
pnpm type-check       # 全仓库 TypeScript 检查
pnpm test             # API 单元测试
pnpm test:e2e         # 真实 MySQL 认证与家庭初始化端到端测试
pnpm build            # 构建共享契约、小程序和 API
pnpm db:generate      # 生成 Prisma Client
pnpm db:migrate       # 创建或应用开发迁移
pnpm db:seed          # 写入本地演示数据
pnpm db:studio        # 打开 Prisma Studio
pnpm db:down          # 停止本项目 Docker 服务
```

微信小程序生产构建位于 `apps/miniapp/dist/build/mp-weixin`，NestJS 构建位于 `apps/api/dist`。

## 数据库说明

本地 MySQL 暴露在 `127.0.0.1:3307`，避免与机器上已有的 3306 冲突。开发账号只拥有业务库和固定影子库权限，不使用 root 账号连接应用。

本地连接参数放在 `apps/api/.env`，该文件不会提交；新环境请复制 `apps/api/.env.example`。

## 接入真实微信登录

在 `apps/api/.env` 配置小程序凭据：

```dotenv
WECHAT_APP_ID=你的小程序AppID
WECHAT_APP_SECRET=你的小程序AppSecret
```

同时将小程序的 `VITE_USE_DEV_LOGIN` 设为 `false`。AppSecret 只保存在后端，不能写入小程序代码或提交到 Git。

微信开发者工具访问本机 API 时可继续使用 `127.0.0.1`；真机无法通过 `127.0.0.1` 访问电脑，需要改为局域网地址，正式体验版则应使用已备案且配置进微信后台的 HTTPS 域名。
