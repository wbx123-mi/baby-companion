# 宝宝的成长簿：项目交接说明

> 更新日期：2026-09-01。本文不记录密码、Token、AppSecret 等敏感信息；它是新开会话时快速恢复项目上下文的入口。

## 1. 项目目标与现状

这是一个供家庭内部使用的微信小程序，用于共同记录宝宝成长、上传照片、邀请家人加入。

- 小程序：UniApp + Vue 3 + TypeScript + Pinia + wot-design-uni。
- API：NestJS + Prisma 7。
- 数据库：MySQL 8.4。
- 图片：MinIO（兼容 S3），照片/头像以对象形式存储，数据库只保存对象元信息与关联关系。
- 部署：阿里云 ECS（2 核 2G）+ Docker Compose + Nginx。
- 视觉：日系成长手帐风，页面素材已逐步迁为 `static.baobao365.top` 的远程资源。

当前基础使用已正常：真实微信登录、创建/加入家庭、家庭成员、成长记录、照片上传、个人/宝宝头像、送花。

## 2. 目录与职责

```text
apps/
  api/              # NestJS API、Prisma schema 和 migrations
  miniapp/          # UniApp 微信小程序
packages/contracts/ # 前后端共享类型与接口契约
docs/               # PRD、部署说明、本文
docker-compose.production.yml
```

重点目录：

- `apps/miniapp/src/pages`：小程序页面。
- `apps/miniapp/src/api`：小程序 API 调用。
- `apps/miniapp/src/services`：请求、Mock 和运行模式适配。
- `apps/miniapp/src/utils/journal-assets.ts`：手帐静态素材远程地址配置。
- `apps/api/src/auth`：微信登录、JWT、刷新令牌、开发模拟登录。
- `apps/api/src/records`：成长记录、版本冲突和送花。
- `apps/api/src/media`：MinIO 预签名上传与头像上传。
- `apps/api/src/profiles`：家庭名称、宝宝档案。
- `apps/api/src/family-invites`：邀请与家庭成员。
- `apps/api/prisma/schema.prisma`：数据库模型。

## 3. 环境与运行模式

小程序的脚本位于 `apps/miniapp/package.json`：

| 模式 | 命令 | 用途 |
| --- | --- | --- |
| `local-mock` | `pnpm --filter @baby-companion/miniapp dev:mp-weixin:local-mock` | 本机 Mock 数据 + 假登录，纯 UI 演示。 |
| `local-real` | `pnpm --filter @baby-companion/miniapp dev:mp-weixin:local-real` | 本地 API/数据库 + 真实微信登录。 |
| `remote-real` | `pnpm --filter @baby-companion/miniapp dev:mp-weixin:remote-real` | 本地开发包连接线上 API，用于真机调试。 |
| `production` | `pnpm --filter @baby-companion/miniapp build:mp-weixin:production` | 体验版/正式版构建，使用线上 API。 |

构建产物路径：`apps/miniapp/dist/build/mp-weixin`。导入微信开发者工具时应导入这个目录，而不是仓库根目录或旧的 `dist/dev` 目录。

本地后端与本地数据库通过 Docker Compose 运行；线上 ECS 的 MySQL/MinIO 与本地完全是两套独立数据和磁盘卷，不会自动同步。

## 4. 生产环境拓扑

```text
微信小程序
  ├─ https://api.baobao365.top/api/v1  → Nginx → API 容器 :3000
  └─ https://static.baobao365.top      → Nginx → MinIO :9000 / 静态资源

API 容器 → MySQL 容器
API 容器 → MinIO 容器
```

生产环境确认过的状态：

- ECS 公网 IP：`121.41.22.26`。
- API 域名：`api.baobao365.top`。
- 静态/对象存储域名：`static.baobao365.top`。
- Nginx 已配置 HTTPS，证书由 Certbot 自动续期。
- 生产 API 健康检查：`https://api.baobao365.top/api/v1/health/ready`。
- API、MySQL、MinIO 运行在 `/opt/baby-companion` 的 Docker Compose 中。
- MinIO 数据使用 Docker 命名卷 `minio_data`，MySQL 使用 `mysql_data`；它们实际落在 ECS 系统盘，不是存在内存里。

安全原则：MySQL 和 MinIO 仅在 Docker 私有网络中运行；API 容器只绑定到 `127.0.0.1:3000`，由 Nginx 对外代理。不要把 3306、9000 直接开放到公网。

## 5. 生产环境常用命令

先连接服务器：

```bash
ssh ecs
cd /opt/baby-companion
```

查看服务与日志：

```bash
docker compose --env-file .env.production -f docker-compose.production.yml ps
docker compose --env-file .env.production -f docker-compose.production.yml logs --tail=100 api
curl -sS https://api.baobao365.top/api/v1/health/ready
```

重启某一服务：

```bash
docker compose --env-file .env.production -f docker-compose.production.yml up -d api
docker compose --env-file .env.production -f docker-compose.production.yml up -d minio
```

查看主机资源：

```bash
free -h
df -h
docker stats --no-stream
```

服务器为 2GB 配置，已启用 2GB Swap。MySQL、MinIO、Node 同时运行时可用内存会较紧张；照片增加主要消耗磁盘，不会长期占用内存。

### 常用排查命令

以下命令在 ECS 的 `/opt/baby-companion` 中执行，除非特别说明。

| 排查目标 | 命令 | 看什么 |
| --- | --- | --- |
| API 是否可用 | `curl -i -sS https://api.baobao365.top/api/v1/health/ready` | 应为 `200`，JSON 中 `status: ok`、`database: up`。 |
| 容器状态 | `docker compose --env-file .env.production -f docker-compose.production.yml ps` | `api`、`mysql`、`minio` 应为 `Up`；MinIO/MySQL 还应为 `healthy`。 |
| API 报错 | `docker compose --env-file .env.production -f docker-compose.production.yml logs --tail=150 api` | 看 4xx/5xx、Prisma、微信登录、MinIO 连接错误。 |
| 持续追踪 API 日志 | `docker compose --env-file .env.production -f docker-compose.production.yml logs -f api` | 实时观察一轮真机操作的请求错误；结束按 `Ctrl+C`。 |
| Nginx 配置 | `nginx -t` | 应显示 `syntax is ok`、`test is successful`。 |
| Nginx 错误 | `tail -n 100 /var/log/nginx/error.log` | 看反向代理、证书、静态资源错误。 |
| 域名解析/HTTPS | `curl -I https://api.baobao365.top/api/v1/health/ready` | 看是否能解析、TLS 是否正常、状态码是否为 200。 |
| MinIO 存活 | `curl -i -sS http://127.0.0.1:9000/minio/health/live` | 本机回环应返回 HTTP 200。 |
| 静态域名代理 | `curl -I https://static.baobao365.top/minio/health/live` | 验证 Nginx 到 MinIO 的链路。 |
| 内存/Swap | `free -h` | 关注 `available`，Swap 被少量使用并不等于故障。 |
| 磁盘空间 | `df -h` | 重点看 `/` 的剩余空间；MinIO 图片会占用这里。 |
| 容器资源 | `docker stats --no-stream` | MySQL、MinIO、API 的内存和 CPU 占用。 |
| 最近系统错误 | `journalctl -p err..alert -b --no-pager` | 看当前开机后的严重系统错误。 |
| 上次开机是否 OOM | `journalctl -b -1 -k --no-pager \| grep -iE 'oom|killed process|out of memory|panic'` | 没输出通常说明没有记录到内核 OOM。 |

小程序真机问题的排查顺序：先看微信开发者工具 Console / Network 的状态码，再看 API 容器日志，最后检查小程序后台的合法域名与构建模式。`401` 通常表示登录令牌失效或尚未登录；`403` 通常表示权限不足；`404` 通常表示线上 API 镜像版本没有对应路由；`500` 再查 API 日志定位。

### 小程序包体与构建产物位置

| 类型 | 目录 | 说明 |
| --- | --- | --- |
| 本地开发包（`local-mock` / `local-real` / `remote-real`） | `apps/miniapp/dist/dev/mp-weixin` | 开发者工具调试时导入此目录；每次启动 dev 会重新生成。 |
| 体验版/生产构建包 | `apps/miniapp/dist/build/mp-weixin` | 执行生产构建后，微信开发者工具上传的就是此目录。 |
| 小程序源码 | `apps/miniapp/src` | 不上传该目录本身，UniApp 会先编译到 `dist`。 |
| API Docker 镜像 | 本机 Docker 镜像仓库（`docker images` 查看） | 常用标签：`baby-companion-api:production`；不是普通文件夹。 |
| ECS 上运行的 API 镜像 | ECS Docker 本地镜像仓库 | 用 `docker images`、`docker inspect baby-companion-api-1` 查看。 |

生产构建命令：

```bash
pnpm --filter @baby-companion/miniapp build:mp-weixin:production
```

然后在微信开发者工具中重新导入或刷新 `apps/miniapp/dist/build/mp-weixin`，确认项目详情中的本地目录确实指向这个目录，再执行上传。

## 6. 图片上传与静态资源

### 用户上传图片

1. 小程序向 API 请求上传意图。
2. API 校验登录用户和家庭成员关系，创建 `media_assets` 元数据，并返回 MinIO 的短时预签名上传信息。
3. 小程序直传图片到 MinIO；文件不是先经 API 中转。
4. 小程序通知 API 完成上传；API 校验对象存在后标记为 `READY`。
5. 记录/头像仅保存 `media_assets` 的关联；展示时 API 生成短时签名读取 URL（当前约 1 小时）。

因此，图片二进制在 ECS 的 MinIO 数据卷中；MySQL 保存对象 key、尺寸、类型、状态和业务关系。

### 手帐静态素材

- 通过 `journalAsset()` 统一生成地址。
- 生产环境应使用 `https://static.baobao365.top/miniapp/journal/v1/...`。
- 图片加载失败时优先检查：小程序后台的合法域名、静态域名 HTTPS、Nginx/MinIO 是否健康、对象 key 是否存在。

## 7. 登录与数据隔离

- 真实登录：前端执行 `wx.login()` 获得临时 `code`；后端携带 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET` 调微信 `jscode2session`，获得 `openid`。
- 用户唯一性：`WECHAT_MINI_PROGRAM + AppID + openid` 在 `user_identities` 表中唯一。
- 后端签发短效 Access Token 与可轮换 Refresh Token；业务接口从 JWT 取当前 `userId`。
- 本地数据库与线上数据库完全独立；同一个微信 `openid` 在两套数据库中会对应两条独立用户数据。
- 任何家庭数据都按 `familyId` 隔离，后端会校验请求人是该家庭的有效成员。

## 8. 当前权限规则（以最新本地代码为准）

| 操作 | 可执行人 |
| --- | --- |
| 修改个人昵称、个人头像 | 本人 |
| 查看家庭、成员、宝宝、成长记录、图片 | 当前家庭所有有效成员 |
| 创建成长记录、上传记录照片、送花 | 当前家庭所有有效成员 |
| 编辑、删除成长记录 | 该记录创建者；或家庭管理员（兜底） |
| 修改宝宝档案、宝宝头像 | 仅家庭管理员 |
| 修改家庭名称、生成邀请码 | 仅家庭管理员 |
| 用邀请码加入家庭 | 已登录、且尚未加入任何有效家庭的用户 |

角色字段有 `ADMIN`、`PARENT`、`RELATIVE`。目前权限上只有 `ADMIN` 与普通成员的区分；`PARENT` 和 `RELATIVE` 权限相同。

邀请码有效期 7 天；管理员重新生成邀请码时，旧邀请码会被撤销。当前产品限制一个用户只能加入一个家庭。

## 9. 最近已提交、待部署的改动

截至本文更新，以下改动已经提交到本地 Git，但不能因此推断已部署到 ECS 或微信：

- `f06e950`：记录仅创建者/管理员可编辑删除；宝宝档案和宝宝头像仅管理员可修改；成长记录返回并展示作者头像。
- `e9d4b4a`：增加开屏状态提示和失败诊断跳转。
- `afe90a5`：增加 API 健康检查、容器进程限制、小程序发布回执、数据库发布计划，并整理 Prisma 标准迁移链。

生产数据库只读计划当前为 `BASELINE_REQUIRED`：实际 Schema 已包含基础表、头像和送花结构，但尚未建立 `_prisma_migrations` 台账。API 部署前应先备份生产 MySQL，并在明确确认后登记 baseline。

发布前执行：

```bash
git status --short
git diff --check
pnpm --filter @baby-companion/api type-check
pnpm --filter @baby-companion/miniapp type-check
pnpm release:plan:db
```

## 10. 上线/体验版检查清单

1. 生产构建：`pnpm --filter @baby-companion/miniapp build:mp-weixin:production`。
2. 导入 `apps/miniapp/dist/build/mp-weixin`，确认 AppID 是正式 AppID。
3. 微信公众平台配置并核对 request 合法域名：`https://api.baobao365.top`；upload/download 合法域名按实际 MinIO 静态域名配置。
4. 真机扫描前，确认 API 健康检查正常、真实微信登录环境变量已在 ECS `.env.production` 设置。
5. 用两台设备验证：创建家庭 → 生成邀请码 → 加入家庭 → 共同查看记录 → 各自创建记录 → 上传照片/头像。
6. 体验版出现白屏/进入“暂时不可用”时，先检查：扫码体验版的启动路径、生产构建模式、登录请求、`/bootstrap` 响应和域名合法性。

## 11. 已知注意事项与后续建议

- ECS 曾出现 Docker/宿主机短暂无响应，重启后恢复；未查到 OOM 或磁盘异常。2GB Swap 是内存兜底，不是持久存储。
- 不在 2GB ECS 上构建镜像：建议本机使用 `linux/amd64` 构建镜像，再 `docker save | ssh | docker load` 传至 ECS，服务器仅负责运行。
- 所有密钥只应存于本地/线上 `.env`，不要提交 Git，不要在聊天截图中完整展示。此前调试期间泄露过的密钥建议择机轮换。
- 图片没有自动垃圾回收：记录删除或更换头像后，旧对象可能仍留在 MinIO。数据稳定后可补“未引用媒体清理任务”。
- 如果要扩展“一个人多个家庭”，需要调整 `bootstrap` 当前默认只处理单一家庭/单一宝宝的逻辑，以及新增家庭上下文切换 UI。

## 12. 新会话建议开场

新开窗口后可直接发送：

> 请先阅读 `docs/project-handoff.md`，不要立即修改代码；先告诉我当前未提交改动和下一步风险。
