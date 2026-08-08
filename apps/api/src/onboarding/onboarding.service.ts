import type { BootstrapContract } from "@baby-companion/contracts";
import { createHash } from "node:crypto";
import { HttpStatus, Injectable } from "@nestjs/common";
import { ulid } from "ulid";
import { BootstrapService } from "../bootstrap/bootstrap.service";
import { AppException } from "../common/app.exception";
import { PrismaService } from "../prisma/prisma.service";
import type { OnboardingDto } from "./dto/onboarding.dto";

const IDEMPOTENCY_SCOPE = "ONBOARDING";

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bootstrapService: BootstrapService,
  ) {}

  async createFamilyContext(
    userId: string,
    idempotencyKey: string | undefined,
    input: OnboardingDto,
  ): Promise<BootstrapContract> {
    if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 128) {
      throw new AppException(
        "IDEMPOTENCY_KEY_REQUIRED",
        "缺少有效的 Idempotency-Key",
        HttpStatus.BAD_REQUEST,
      );
    }

    const birthDate = new Date(`${input.baby.birthDate}T00:00:00.000Z`);
    if (Number.isNaN(birthDate.getTime()) || birthDate.getTime() > Date.now()) {
      throw new AppException("INVALID_BIRTH_DATE", "出生日期不正确", HttpStatus.BAD_REQUEST);
    }
    const birthTime = input.baby.birthTime
      ? new Date(`1970-01-01T${input.baby.birthTime.length === 5 ? `${input.baby.birthTime}:00` : input.baby.birthTime}.000Z`)
      : null;
    const requestHash = createHash("sha256").update(JSON.stringify(input)).digest("hex");

    await this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;

      const existingKey = await transaction.idempotencyKey.findUnique({
        where: {
          userId_scope_idempotencyKey: {
            userId,
            scope: IDEMPOTENCY_SCOPE,
            idempotencyKey,
          },
        },
      });
      if (existingKey) {
        if (existingKey.requestHash !== requestHash) {
          throw new AppException(
            "IDEMPOTENCY_CONFLICT",
            "同一个幂等键不能提交不同内容",
            HttpStatus.CONFLICT,
          );
        }
        if (existingKey.status === "SUCCEEDED") return;
        throw new AppException(
          "IDEMPOTENCY_IN_PROGRESS",
          "相同请求正在处理中，请稍后重试",
          HttpStatus.CONFLICT,
        );
      }

      const existingMembership = await transaction.familyMember.findFirst({
        where: { userId, status: "ACTIVE", family: { status: "ACTIVE" } },
      });
      if (existingMembership) {
        throw new AppException(
          "ONBOARDING_ALREADY_COMPLETED",
          "你已经创建或加入了家庭",
          HttpStatus.CONFLICT,
          { familyId: existingMembership.familyId },
        );
      }

      const familyId = ulid();
      const babyId = ulid();
      await transaction.family.create({
        data: {
          id: familyId,
          name: input.family.name.trim(),
          ownerUserId: userId,
          status: "ACTIVE",
          members: {
            create: {
              id: ulid(),
              userId,
              role: "ADMIN",
              status: "ACTIVE",
              joinedAt: new Date(),
            },
          },
          babies: {
            create: {
              id: babyId,
              nickname: input.baby.nickname.trim(),
              birthDate,
              birthTime,
              timezone: input.baby.timezone,
              gender: input.baby.gender,
              status: "ACTIVE",
            },
          },
        },
      });

      await transaction.idempotencyKey.create({
        data: {
          id: ulid(),
          userId,
          scope: IDEMPOTENCY_SCOPE,
          idempotencyKey,
          requestHash,
          status: "SUCCEEDED",
          responseStatus: HttpStatus.CREATED,
          responseJson: { familyId, babyId },
          expiresAt: new Date(Date.now() + 86_400_000),
        },
      });
    });

    return this.bootstrapService.getContext(userId);
  }
}
