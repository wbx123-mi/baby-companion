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

```bash
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
docker compose --env-file .env.production -f docker-compose.production.yml run --rm api node_modules/.bin/prisma migrate deploy --config apps/api/prisma.config.ts
docker compose --env-file .env.production -f docker-compose.production.yml ps
curl http://127.0.0.1:3000/api/v1/health/ready
```

## 当前网络边界

- API 仅监听 `127.0.0.1:3000`，不对公网暴露。
- MySQL 与 MinIO 仅加入 Docker 私有网络。
- 域名备案完成后再添加 Nginx、HTTPS、`api`/`files` 子域名，以及微信合法域名。
