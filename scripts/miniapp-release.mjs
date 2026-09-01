import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(SCRIPT_DIR, "..");
const PENDING_FILE = resolve(ROOT_DIR, ".release/miniapp-pending.json");
const HISTORY_FILE = resolve(ROOT_DIR, "docs/deployment-history.md");

function git(...args) {
  return execFileSync("git", args, { cwd: ROOT_DIR, encoding: "utf8" }).trim();
}

function currentBranch() {
  try {
    return git("symbolic-ref", "--short", "HEAD");
  } catch {
    return "detached";
  }
}

function readPending() {
  if (!existsSync(PENDING_FILE)) {
    throw new Error("没有待发布记录，请先执行 pnpm build:miniapp:production");
  }
  return JSON.parse(readFileSync(PENDING_FILE, "utf8"));
}

function escapeCell(value) {
  return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", "<br>");
}

function prepare() {
  const changedFiles = git("status", "--short").split("\n").filter(Boolean);
  const record = {
    status: "PENDING",
    builtAt: new Date().toISOString(),
    commit: git("rev-parse", "HEAD"),
    branch: currentBranch(),
    dirty: changedFiles.length > 0,
    changedFiles,
    artifact: "apps/miniapp/dist/build/mp-weixin",
  };

  mkdirSync(dirname(PENDING_FILE), { recursive: true });
  writeFileSync(PENDING_FILE, `${JSON.stringify(record, null, 2)}\n`);

  console.log("\n小程序生产包已构建，并生成待发布记录：");
  console.log(`- Commit: ${record.commit.slice(0, 12)}`);
  console.log(`- 工作区: ${record.dirty ? `有 ${record.changedFiles.length} 项未提交改动` : "干净"}`);
  console.log(`- 产物: ${record.artifact}`);
  console.log("\n请在微信开发者工具上传并完成发布。发布成功后执行：");
  console.log("pnpm release:confirm:miniapp <微信版本号> <experience|production> [备注]");
}

function confirm(args) {
  const [version, channel = "production", ...noteParts] = args.filter((arg) => arg !== "--");
  if (!version || !["experience", "production"].includes(channel)) {
    throw new Error("用法：pnpm release:confirm:miniapp <微信版本号> <experience|production> [备注]");
  }

  const pending = readPending();
  const releasedAt = new Date().toISOString();
  const notes = noteParts.join(" ") || "-";
  const row = `| ${escapeCell(releasedAt)} | ${escapeCell(channel)} | ${escapeCell(version)} | \`${escapeCell(pending.commit.slice(0, 12))}\` | ${pending.dirty ? "是" : "否"} | ${escapeCell(pending.builtAt)} | ${escapeCell(notes)} |\n`;

  if (!existsSync(HISTORY_FILE)) {
    throw new Error("缺少 docs/deployment-history.md，无法写入发布历史");
  }
  appendFileSync(HISTORY_FILE, row);
  writeFileSync(PENDING_FILE, `${JSON.stringify({ ...pending, status: "RELEASED", version, channel, notes, releasedAt }, null, 2)}\n`);

  console.log(`已记录小程序 ${version}（${channel}）发布，Commit ${pending.commit.slice(0, 12)}。`);
  if (pending.dirty) console.warn("注意：该构建包含未提交改动，Git Commit 无法完整还原此发布包。");
}

function status() {
  console.log(JSON.stringify(readPending(), null, 2));
}

const [command, ...args] = process.argv.slice(2);

try {
  if (command === "prepare") prepare();
  else if (command === "confirm") confirm(args);
  else if (command === "status") status();
  else throw new Error("用法：node scripts/miniapp-release.mjs <prepare|confirm|status>");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
