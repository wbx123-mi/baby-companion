# Prisma migration 历史归档

此目录中的 SQL 仅用于保留历史证据，Prisma 不会执行这里的文件。

- `20260807042711_init`：早期初始化迁移。
- `20260807135436_family_invites`：早期家庭邀请增量迁移。

两者的最终结构已经合并进 `prisma/migrations/20260809000000_init`。如果继续放在标准 `migrations` 目录，新建数据库时会重复创建表，因此于 2026-09-01 移入归档。

不要删除或修改归档 SQL；它们用于解释历史数据库结构来源。生产 baseline 只登记标准 `migrations` 目录中的三条迁移。
