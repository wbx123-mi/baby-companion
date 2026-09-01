import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(SCRIPT_DIR, "..");
const MIGRATIONS_DIR = resolve(ROOT_DIR, "apps/api/prisma/migrations");
const PLAN_FILE = resolve(ROOT_DIR, ".release/db-plan.json");
const SSH_HOST = process.env.DB_RELEASE_SSH_HOST || "ecs";
const REMOTE_DIR = process.env.DB_RELEASE_REMOTE_DIR || "/opt/baby-companion";
const COMPOSE = "docker compose --env-file .env.production -f docker-compose.production.yml";

const BASE_TABLES = [
  "audit_logs",
  "auth_refresh_tokens",
  "auth_sessions",
  "babies",
  "families",
  "family_invites",
  "family_members",
  "growth_record_assets",
  "growth_records",
  "idempotency_keys",
  "media_assets",
  "user_identities",
  "users",
];

function shellQuote(value) {
  return `'${String(value).replaceAll("'", `'"'"'`)}'`;
}

function git(...args) {
  return execFileSync("git", args, { cwd: ROOT_DIR, encoding: "utf8" }).trim();
}

function remoteMysql(sql) {
  const mysqlCommand = `MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -N -B -uroot "$MYSQL_DATABASE" -e ${shellQuote(sql)}`;
  const remoteCommand = `cd ${shellQuote(REMOTE_DIR)} && ${COMPOSE} exec -T mysql sh -lc ${shellQuote(mysqlCommand)}`;
  return execFileSync("ssh", [SSH_HOST, remoteCommand], {
    cwd: ROOT_DIR,
    encoding: "utf8",
    timeout: 45_000,
  }).trim();
}

function listLocalMigrations() {
  return readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const sqlPath = resolve(MIGRATIONS_DIR, entry.name, "migration.sql");
      if (!existsSync(sqlPath)) throw new Error(`迁移缺少 migration.sql：${entry.name}`);
      const sql = readFileSync(sqlPath);
      return {
        name: entry.name,
        checksum: createHash("sha256").update(sql).digest("hex"),
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function queryProductionState() {
  const tables = remoteMysql("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME;")
    .split("\n")
    .filter(Boolean);
  const migrationTableExists = tables.includes("_prisma_migrations");
  const migrations = migrationTableExists
    ? remoteMysql("SELECT migration_name, checksum, IFNULL(DATE_FORMAT(finished_at, '%Y-%m-%dT%H:%i:%s'), '') FROM _prisma_migrations ORDER BY started_at;")
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const [name, checksum, finishedAt] = line.split("\t");
          return { name, checksum, finishedAt };
        })
    : [];
  const avatarColumns = Number(remoteMysql("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_NAME = 'avatar_asset_id' AND TABLE_NAME IN ('users', 'babies');"));
  const flowerTable = tables.includes("growth_record_flowers");

  return {
    tables,
    migrationTableExists,
    migrations,
    evidence: {
      baseSchema: BASE_TABLES.every((table) => tables.includes(table)),
      profileAvatars: avatarColumns === 2,
      growthRecordFlowers: flowerTable,
    },
  };
}

function determineStatus(localMigrations, production) {
  const localNames = localMigrations.map((migration) => migration.name);
  const remoteNames = production.migrations.map((migration) => migration.name);
  const schemaMatchesBaseline = Object.values(production.evidence).every(Boolean);

  if (!production.migrationTableExists && schemaMatchesBaseline) return "BASELINE_REQUIRED";
  if (!production.migrationTableExists) return "SCHEMA_MISMATCH";
  if (localNames.every((name) => remoteNames.includes(name))) return "READY";
  return "MIGRATION_HISTORY_INCOMPLETE";
}

function plan() {
  const localMigrations = listLocalMigrations();
  const production = queryProductionState();
  const changedFiles = git("status", "--short").split("\n").filter(Boolean);
  const result = {
    generatedAt: new Date().toISOString(),
    environment: "production",
    sshHost: SSH_HOST,
    remoteDir: REMOTE_DIR,
    git: {
      commit: git("rev-parse", "HEAD"),
      dirty: changedFiles.length > 0,
      changedFiles,
    },
    localMigrations,
    production,
    status: determineStatus(localMigrations, production),
  };

  mkdirSync(dirname(PLAN_FILE), { recursive: true });
  writeFileSync(PLAN_FILE, `${JSON.stringify(result, null, 2)}\n`);

  console.log(`数据库发布计划：${result.status}`);
  console.log(`本地标准 migration：${localMigrations.map((migration) => migration.name).join(", ")}`);
  console.log(`生产迁移台账：${production.migrationTableExists ? `${production.migrations.length} 条` : "不存在"}`);
  console.log(`生产 Schema 证据：基础表=${production.evidence.baseSchema}，头像=${production.evidence.profileAvatars}，送花=${production.evidence.growthRecordFlowers}`);
  if (result.status === "BASELINE_REQUIRED") {
    console.log("下一步：先备份生产库，再将现有三条 migration 登记为 baseline；本命令没有修改生产库。");
  }
}

function status() {
  if (!existsSync(PLAN_FILE)) throw new Error("没有数据库计划记录，请先执行 pnpm release:plan:db");
  console.log(readFileSync(PLAN_FILE, "utf8"));
}

const [command] = process.argv.slice(2);

try {
  if (command === "plan") plan();
  else if (command === "status") status();
  else throw new Error("用法：node scripts/db-release.mjs <plan|status>");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
