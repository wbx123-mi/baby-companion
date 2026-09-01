# ECS 部署（域名备案前）

本阶段只部署 API、MySQL 与 MinIO，不对公网开放业务端口。小程序仍使用本地开发配置；域名、HTTPS 与微信体验版在备案完成后接入。

## 服务器准备

安装 Docker：

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker
docker --version
docker compose version
```

克隆项目并进入目录：

```bash
git clone https://github.com/wbx123-mi/baby-companion.git /opt/baby-companion
cd /opt/baby-companion
```

## 生产环境变量

```bash
cp .env.production.example .env.production
nano .env.production
```

上线前必须替换所有 `CHANGE_ME`。可用以下命令生成随机密钥：

```bash
openssl rand -hex 32
```

域名备案前，`CORS_ORIGIN` 可保留示例占位值；不要把 `.env.production` 提交 Git。

## 启动与迁移

先在本机构建并传输 API 镜像，避免在 2GiB ECS 上编译 Node.js：

```bash
docker build -f apps/api/Dockerfile -t baby-companion-api:production .
docker save baby-companion-api:production | gzip | ssh ecs "gunzip | docker load"
```

然后在服务器项目目录执行：

```bash
docker compose --env-file .env.production -f docker-compose.production.yml up -d
# 首次部署：将版本化的初始 schema 导入空的生产数据库。
docker compose --env-file .env.production -f docker-compose.production.yml exec -T mysql sh -lc 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot baby_companion' < apps/api/prisma/migrations/20260809000000_init/migration.sql
docker compose --env-file .env.production -f docker-compose.production.yml ps
curl http://127.0.0.1:3000/api/v1/health/ready
```

## 时间与重置策略

- MySQL 与 API 统一以 UTC 保存时间；小程序展示时按宝宝的 `Asia/Shanghai` 时区转换。
- 需要清空某个环境的业务数据时，先导入 `docker/mysql/reset-business-data.sql`，再导入 `apps/api/prisma/migrations/20260809000000_init/migration.sql`。该操作会删除用户、家庭、成长记录和媒体元数据，但不会删除 MySQL 数据卷。

## 当前网络边界

- API 仅监听 `127.0.0.1:3000`，不对公网暴露。
- MySQL 与 MinIO 仅加入 Docker 私有网络。
- 域名备案完成后再添加 Nginx、HTTPS、`api`/`files` 子域名，以及微信合法域名。

## 小程序手帐素材地址

手帐插画统一通过 `src/utils/journal-assets.ts` 生成地址，页面内不再直接拼接服务器域名。

- `VITE_ASSET_BASE_URL` 留空：读取 `/static/journal`，适合当前本地开发和域名备案期间预览。
- 配置 `VITE_ASSET_BASE_URL`：读取远程 MinIO/CDN 地址，适合体验版和生产环境。

生产环境示例：

```env
VITE_ASSET_BASE_URL=https://static.example.com/miniapp/journal/v1
```

远程对象应保持与本地文件名一致，例如：

```text
miniapp/journal/v1/card-bg.webp
miniapp/journal/v1/icon_01.webp
miniapp/journal/v1/story11.webp
```

域名和 HTTPS 就绪后的切换步骤：

1. 将手帐素材上传到独立的公开只读目录或素材桶，家庭头像、成长照片仍保存在私有桶中。
2. 通过 Nginx 或 CDN 将 `https://static.example.com/miniapp/journal/v1/*` 映射到对应对象。
3. 在微信公众平台配置素材域名，并在小程序生产环境变量中填写 `VITE_ASSET_BASE_URL`。
4. 重新构建并上传小程序；页面代码不需要逐个修改。
5. 真机确认所有远程素材加载正常后，再从小程序包中移出对应素材以缩小包体。

以下启动关键资源始终保留在小程序本地，避免首次启动依赖网络：

- 原生 tabBar 的 6 张选中/未选中图标。
- 页面纹理背景 `bg-page.webp`。
- 默认头像和加载兜底图 `icon_47.webp`。

远程公共素材可以设置长期缓存；发布同名文件的新版本时，优先升级路径中的版本号（例如 `v1` 改为 `v2`），避免客户端继续命中旧缓存。

## 小程序发布记录

生产构建统一执行：

```bash
pnpm build:miniapp:production
```

构建成功后会生成本地待发布凭证 `.release/miniapp-pending.json`。该凭证只表示生产包已经构建，不表示已经上传或上线。通过微信开发者工具上传并在微信后台完成发布后，执行：

```bash
pnpm release:confirm:miniapp <微信版本号> <experience|production> [备注]
```

确认命令会把版本、渠道、Git Commit、构建时间、发布时间以及工作区是否包含未提交改动写入 `docs/deployment-history.md`。可通过 `pnpm release:status:miniapp` 查看最近一次构建或发布状态。

## 数据库迁移记录

生产数据库采用 Prisma migration 作为标准台账。任何数据库变更前先执行只读计划：

```bash
pnpm release:plan:db
pnpm release:status:db
```

计划会通过 SSH 只读检查生产库，记录本地 migration 的 SHA-256、生产 `_prisma_migrations` 状态以及关键 Schema 是否存在，并写入本地 `.release/db-plan.json`。它不会备份、建表或修改生产数据库。

标准迁移链为：

```text
20260809000000_init
→ 20260809010000_add_profile_avatars
→ 20260822000000_add_growth_record_flowers
```

早期重复的 `20260807042711_init` 和 `20260807135436_family_invites` 已移入 `apps/api/prisma/migrations-archive`，只保留为历史证据。

当前生产库已有上述最终 Schema，但尚无 `_prisma_migrations` 台账。首次切换标准迁移前必须：备份生产库、核对计划状态为 `BASELINE_REQUIRED`、使用 Prisma `migrate resolve --applied` 登记三条现有 migration，重新执行只读计划确认状态为 `READY`。此 baseline 属于生产写操作，必须单独确认后执行。

## 线上健康检查与告警

生产 Compose 为 API、MySQL、MinIO 都配置了容器健康检查，并设置了进程数上限：API 160、MySQL 256、MinIO 128。当前 2GiB ECS 上的 MySQL 和 MinIO 已有较高正常常驻内存，因此不设置过紧的硬内存上限，避免服务在正常波动时被错误杀掉。健康检查会让 `docker compose ps` 直接显示服务状态，但不会在宿主机完全卡死时自动重启 ECS。

每次部署后执行：

```bash
docker compose --env-file .env.production -f docker-compose.production.yml up -d
docker compose --env-file .env.production -f docker-compose.production.yml ps
curl -fsS http://127.0.0.1:3000/api/v1/health/ready
```

为发现“整机或 Docker 无响应”这类容器内无法自救的故障，需要在阿里云控制台配置外部探测：

1. 进入 `云监控 → 站点监控 → 创建任务`，探测类型选择 HTTPS。
2. 分别创建两个任务：
   - `https://api.baobao365.top/api/v1/health/ready`，预期 HTTP 状态 `200`。
   - `https://static.baobao365.top/miniapp/journal/v1/growth-card-transparent.webp`，预期 HTTP 状态 `200`。
3. 将连续失败 3 次设为告警条件，并绑定你的短信、电话或钉钉/邮件通知联系人。

这样即使 ECS、Docker 和 SSH 同时无响应，也能从服务器外部及时发现故障。告警联系人和阿里云账号权限属于控制台私有配置，不能写入代码仓库。
