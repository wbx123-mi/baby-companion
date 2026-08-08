import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request = require("supertest");
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configure-app";
import { PrismaService } from "../src/prisma/prisma.service";

interface AuthPayload {
  accessToken: string;
  refreshToken: string;
}

describe("authentication and onboarding flow", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const originalNodeEnv = process.env.NODE_ENV;
  const subject = `e2e-${Date.now()}`;
  const userIds: string[] = [];

  beforeAll(async () => {
    process.env.NODE_ENV = "development";
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app, "http://localhost:5173");
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (userIds.length) {
      const memberships = await prisma.familyMember.findMany({ where: { userId: { in: userIds } } });
      const familyIds = memberships.map((member) => member.familyId);
      await prisma.$transaction([
        prisma.familyInvite.deleteMany({ where: { familyId: { in: familyIds } } }),
        prisma.idempotencyKey.deleteMany({ where: { userId: { in: userIds } } }),
        prisma.growthRecord.deleteMany({ where: { creatorUserId: { in: userIds } } }),
        prisma.baby.deleteMany({ where: { familyId: { in: familyIds } } }),
        prisma.familyMember.deleteMany({ where: { familyId: { in: familyIds } } }),
        prisma.family.deleteMany({ where: { id: { in: familyIds } } }),
        prisma.authRefreshToken.deleteMany({ where: { session: { userId: { in: userIds } } } }),
        prisma.authSession.deleteMany({ where: { userId: { in: userIds } } }),
        prisma.userIdentity.deleteMany({ where: { userId: { in: userIds } } }),
        prisma.user.deleteMany({ where: { id: { in: userIds } } }),
      ]);
    }
    await app.close();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("creates a session, family context and rotates refresh tokens safely", async () => {
    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/dev-login")
      .send({ subject, nickname: "端到端测试用户", deviceId: "e2e-device" })
      .expect(201);
    const firstTokens = login.body.data as AuthPayload & { user: { id: string } };
    userIds.push(firstTokens.user.id);

    const beforeOnboarding = await request(app.getHttpServer())
      .get("/api/v1/bootstrap")
      .set("authorization", `Bearer ${firstTokens.accessToken}`)
      .expect(200);
    expect(beforeOnboarding.body.data.nextAction).toBe("NO_FAMILY");

    const onboarding = await request(app.getHttpServer())
      .post("/api/v1/onboarding")
      .set("authorization", `Bearer ${firstTokens.accessToken}`)
      .set("idempotency-key", `e2e-${Date.now()}`)
      .send({
        family: { name: "测试家庭" },
        baby: {
          nickname: "测试宝宝",
          birthDate: "2026-07-30",
          birthTime: "08:26:00",
          timezone: "Asia/Shanghai",
          gender: "UNSPECIFIED",
        },
      })
      .expect(201);
    expect(onboarding.body.data.nextAction).toBe("ENTER_APP");
    expect(onboarding.body.data.baby.nickname).toBe("测试宝宝");
    const familyId = onboarding.body.data.currentContext.familyId as string;
    const babyId = onboarding.body.data.baby.id as string;

    const createdRecord = await request(app.getHttpServer())
      .post("/api/v1/records")
      .set("authorization", `Bearer ${firstTokens.accessToken}`)
      .send({
        babyId,
        type: "DAILY",
        content: "这是一条真实写入数据库的成长记录。",
        occurredAt: "2026-08-07T08:30:00.000Z",
        clientRequestId: `record-${Date.now()}`,
      })
      .expect(201);
    expect(createdRecord.body.data.content).toBe("这是一条真实写入数据库的成长记录。");

    const updatedRecord = await request(app.getHttpServer())
      .put(`/api/v1/records/${createdRecord.body.data.id}`)
      .set("authorization", `Bearer ${firstTokens.accessToken}`)
      .send({
        type: "FIRST",
        content: "这是一条更新后的真实成长记录。",
        occurredAt: "2026-08-07T09:30:00.000Z",
        version: createdRecord.body.data.version,
      })
      .expect(200);
    expect(updatedRecord.body.data.version).toBe(2);

    const invitation = await request(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/invites`)
      .set("authorization", `Bearer ${firstTokens.accessToken}`)
      .expect(201);
    expect(invitation.body.data.code).toMatch(/^[A-Z2-9]{5}-[A-Z2-9]{5}$/);

    const memberLogin = await request(app.getHttpServer())
      .post("/api/v1/auth/dev-login")
      .send({ subject: `${subject}-member`, nickname: "端到端加入者", deviceId: "e2e-member-device" })
      .expect(201);
    const memberTokens = memberLogin.body.data as AuthPayload & { user: { id: string } };
    userIds.push(memberTokens.user.id);

    const memberBeforeJoin = await request(app.getHttpServer())
      .get("/api/v1/bootstrap")
      .set("authorization", `Bearer ${memberTokens.accessToken}`)
      .expect(200);
    expect(memberBeforeJoin.body.data.nextAction).toBe("NO_FAMILY");

    const joined = await request(app.getHttpServer())
      .post("/api/v1/family-invites/join")
      .set("authorization", `Bearer ${memberTokens.accessToken}`)
      .send({ code: invitation.body.data.code.toLowerCase() })
      .expect(200);
    expect(joined.body.data.nextAction).toBe("ENTER_APP");
    expect(joined.body.data.currentContext.familyId).toBe(familyId);
    expect(joined.body.data.families[0].role).toBe("RELATIVE");
    expect(joined.body.data.baby.nickname).toBe("测试宝宝");

    const memberRecords = await request(app.getHttpServer())
      .get(`/api/v1/records?babyId=${babyId}`)
      .set("authorization", `Bearer ${memberTokens.accessToken}`)
      .expect(200);
    expect(memberRecords.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: createdRecord.body.data.id,
        content: "这是一条更新后的真实成长记录。",
      }),
    ]));

    await request(app.getHttpServer())
      .delete(`/api/v1/records/${createdRecord.body.data.id}`)
      .set("authorization", `Bearer ${firstTokens.accessToken}`)
      .send({ version: updatedRecord.body.data.version })
      .expect(204);

    const refresh = await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: firstTokens.refreshToken })
      .expect(201);
    const secondTokens = refresh.body.data as AuthPayload;
    expect(secondTokens.refreshToken).not.toBe(firstTokens.refreshToken);

    const reuse = await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: firstTokens.refreshToken })
      .expect(401);
    expect(reuse.body.code).toBe("AUTH_REFRESH_REUSED");

    const revokedSession = await request(app.getHttpServer())
      .get("/api/v1/bootstrap")
      .set("authorization", `Bearer ${secondTokens.accessToken}`)
      .expect(401);
    expect(revokedSession.body.code).toBe("AUTH_SESSION_EXPIRED");
  });
});
