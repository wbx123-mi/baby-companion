/**
 * 上传小程序手帐素材到 MinIO（journal/v1 前缀）。
 *
 * 用法（在仓库根目录执行）：
 *   node apps/api/scripts/upload-journal-assets.mjs            # 仅上传
 *   node apps/api/scripts/upload-journal-assets.mjs --apply-policy  # 先设前缀公开策略再上传
 *
 * 说明：
 * - 仅给 journal/* 前缀开放匿名读，bucket 其余部分保持私有（保护用户私密图）。
 * - 跳过 tab-*.png（pages.json 引用，必须本地）和 bg-page.webp（全局 CSS 背景，保留本地）。
 * - S3 配置优先读环境变量，缺省用与 media.service 一致的本地 MinIO 默认值。
 */
import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { PutBucketPolicyCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const BUCKET = process.env.S3_BUCKET || "baby-companion";
const ENDPOINT = process.env.S3_ENDPOINT || "http://127.0.0.1:9000";
const REGION = process.env.S3_REGION || "us-east-1";
const ACCESS_KEY = process.env.S3_ACCESS_KEY || "baby_companion_minio";
const SECRET_KEY = process.env.S3_SECRET_KEY || "local_minio_password";
const PREFIX = "journal/v1";

const SOURCE_DIR = join(__dirname, "../../miniapp/src/static/journal");

/** 本地保留、不上传的文件（构建期仍需从 src/static 读取） */
const EXCLUDED = new Set(["bg-page.webp", ".DS_Store"]);
const isTabIcon = (name) => /^tab-.*\.png$/.test(name);

const MIME_BY_EXT = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

const client = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  forcePathStyle: true,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
});

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(full)));
    else files.push(full);
  }
  return files;
}

async function applyPolicy() {
  const publicPrefix = PREFIX.split("/")[0]; // journal
  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: { AWS: ["*"] },
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${BUCKET}/${publicPrefix}/*`],
      },
    ],
  };
  await client.send(
    new PutBucketPolicyCommand({ Bucket: BUCKET, Policy: JSON.stringify(policy) })
  );
  console.log(`[policy] ${BUCKET}/${publicPrefix}/* 已设为匿名公开读（其余保持私有）`);
}

async function uploadAll() {
  const files = await collectFiles(SOURCE_DIR);
  let uploaded = 0;
  let skipped = 0;

  for (const full of files) {
    const rel = relative(SOURCE_DIR, full).split(sep).join("/");
    const name = rel.split("/").pop();
    if (EXCLUDED.has(name) || isTabIcon(name)) {
      skipped += 1;
      console.log(`[skip] ${rel}（本地保留）`);
      continue;
    }

    const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
    const contentType = MIME_BY_EXT[ext] || "application/octet-stream";
    const Key = `${PREFIX}/${rel}`;
    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key,
        Body: await readFile(full),
        ContentType: contentType,
      })
    );
    uploaded += 1;
    console.log(`[ok]   ${Key}  ${contentType}`);
  }

  console.log(`\n完成：上传 ${uploaded} 个，跳过 ${skipped} 个（本地保留）`);
}

const args = process.argv.slice(2);
if (args.includes("--apply-policy")) {
  await applyPolicy();
}
await uploadAll();
