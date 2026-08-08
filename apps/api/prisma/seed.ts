import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";
import { parseMariaDbUrl } from "../src/prisma/database-url";

function seedId(value: string): string {
  return value.padEnd(26, "0").slice(0, 26);
}

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(parseMariaDbUrl(process.env.DATABASE_URL || "")),
});

async function main(): Promise<void> {
  const userId = seedId("01J4M3USER");
  const familyId = seedId("01J4M3FAMILY");
  const memberId = seedId("01J4M3MEMBER");
  const babyId = seedId("01J4M3BABY");
  const recordId = seedId("01J4M3RECORD");

  await prisma.user.upsert({
    where: { id: userId },
    update: { nickname: "小舅舅" },
    create: {
      id: userId,
      nickname: "小舅舅",
      status: "ACTIVE",
    },
  });

  await prisma.family.upsert({
    where: { id: familyId },
    update: { name: "小满的家" },
    create: {
      id: familyId,
      name: "小满的家",
      ownerUserId: userId,
      status: "ACTIVE",
    },
  });

  await prisma.familyMember.upsert({
    where: { familyId_userId: { familyId, userId } },
    update: { role: "ADMIN", status: "ACTIVE", removedAt: null },
    create: {
      id: memberId,
      familyId,
      userId,
      role: "ADMIN",
      status: "ACTIVE",
      joinedAt: new Date("2026-07-30T01:00:00.000Z"),
    },
  });

  await prisma.baby.upsert({
    where: { id: babyId },
    update: { nickname: "小满" },
    create: {
      id: babyId,
      familyId,
      nickname: "小满",
      birthDate: new Date("2026-07-30T00:00:00.000Z"),
      birthTime: new Date("1970-01-01T08:26:00.000Z"),
      timezone: "Asia/Shanghai",
      gender: "UNSPECIFIED",
      introduction: "欢迎来到这个温柔的世界。",
      status: "ACTIVE",
    },
  });

  await prisma.growthRecord.upsert({
    where: { id: recordId },
    update: { content: "第一次写进真实数据库的成长记录。" },
    create: {
      id: recordId,
      familyId,
      babyId,
      creatorUserId: userId,
      type: "FIRST",
      content: "第一次写进真实数据库的成长记录。",
      occurredAt: new Date("2026-08-06T01:15:00.000Z"),
      status: "ACTIVE",
    },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
