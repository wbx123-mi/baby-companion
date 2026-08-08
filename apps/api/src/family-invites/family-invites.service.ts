import type {
  BootstrapContract,
  FamilyInviteContract,
  FamilyMemberContract,
} from "@baby-companion/contracts";
import { createHmac, randomInt } from "node:crypto";
import { HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ulid } from "ulid";
import { BootstrapService } from "../bootstrap/bootstrap.service";
import { AppException } from "../common/app.exception";
import { PrismaService } from "../prisma/prisma.service";

const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INVITE_LENGTH = 10;
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class FamilyInvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly bootstrapService: BootstrapService,
  ) {}

  async createInvite(userId: string, familyId: string): Promise<FamilyInviteContract> {
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

    const family = await this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw`SELECT id FROM families WHERE id = ${familyId} FOR UPDATE`;

      const membership = await transaction.familyMember.findUnique({
        where: { familyId_userId: { familyId, userId } },
        include: { family: true },
      });
      if (
        !membership
        || membership.status !== "ACTIVE"
        || membership.role !== "ADMIN"
        || membership.family.status !== "ACTIVE"
      ) {
        throw new AppException(
          "FAMILY_ADMIN_REQUIRED",
          "只有家庭管理员可以生成邀请码",
          HttpStatus.FORBIDDEN,
        );
      }

      const now = new Date();
      await transaction.familyInvite.updateMany({
        where: { familyId, status: "ACTIVE" },
        data: { status: "REVOKED", revokedAt: now },
      });
      await transaction.familyInvite.create({
        data: {
          id: ulid(),
          familyId,
          createdByUserId: userId,
          codeHash: this.hashCode(code),
          status: "ACTIVE",
          expiresAt,
        },
      });
      return membership.family;
    });

    return {
      code: this.formatCode(code),
      expiresAt: expiresAt.toISOString(),
      family: { id: family.id, name: family.name },
    };
  }

  async getFamilyMembers(userId: string, familyId: string): Promise<FamilyMemberContract[]> {
    const requesterMembership = await this.prisma.familyMember.findUnique({
      where: { familyId_userId: { familyId, userId } },
      include: { family: { select: { status: true } } },
    });
    if (
      !requesterMembership
      || requesterMembership.status !== "ACTIVE"
      || requesterMembership.family.status !== "ACTIVE"
    ) {
      throw new AppException("FAMILY_ACCESS_DENIED", "你还没有加入这个家庭", HttpStatus.FORBIDDEN);
    }

    const members = await this.prisma.familyMember.findMany({
      where: { familyId, status: "ACTIVE", user: { status: "ACTIVE" } },
      include: { user: { select: { id: true, nickname: true, avatarUrl: true } } },
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    });
    return members.map((member) => ({
      userId: member.user.id,
      nickname: member.user.nickname,
      avatarUrl: member.user.avatarUrl,
      role: member.role,
      joinedAt: member.joinedAt.toISOString(),
    }));
  }

  async joinFamily(userId: string, rawCode: string): Promise<BootstrapContract> {
    const code = this.normalizeCode(rawCode);
    if (code.length !== INVITE_LENGTH) {
      throw new AppException("INVITE_CODE_INVALID", "邀请码不正确", HttpStatus.NOT_FOUND);
    }
    const codeHash = this.hashCode(code);
    const now = new Date();

    await this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;

      const existingMembership = await transaction.familyMember.findFirst({
        where: { userId, status: "ACTIVE", family: { status: "ACTIVE" } },
      });
      if (existingMembership) {
        throw new AppException(
          "FAMILY_ALREADY_JOINED",
          "你已经加入了一个家庭",
          HttpStatus.CONFLICT,
          { familyId: existingMembership.familyId },
        );
      }

      const invite = await transaction.familyInvite.findUnique({
        where: { codeHash },
        include: { family: true },
      });
      if (!invite || invite.status !== "ACTIVE" || invite.family.status !== "ACTIVE") {
        throw new AppException("INVITE_CODE_INVALID", "邀请码不正确或已失效", HttpStatus.NOT_FOUND);
      }
      if (invite.expiresAt.getTime() <= now.getTime()) {
        throw new AppException("INVITE_CODE_EXPIRED", "邀请码已过期，请让管理员重新生成", HttpStatus.GONE);
      }

      await transaction.familyMember.create({
        data: {
          id: ulid(),
          familyId: invite.familyId,
          userId,
          role: "RELATIVE",
          status: "ACTIVE",
          joinedAt: now,
        },
      });
      await transaction.familyInvite.update({
        where: { id: invite.id },
        data: { useCount: { increment: 1 } },
      });
    });

    return this.bootstrapService.getContext(userId);
  }

  private generateCode(): string {
    return Array.from(
      { length: INVITE_LENGTH },
      () => INVITE_ALPHABET[randomInt(0, INVITE_ALPHABET.length)],
    ).join("");
  }

  private normalizeCode(code: string): string {
    return code.toUpperCase().replace(/[\s-]/g, "");
  }

  private formatCode(code: string): string {
    return `${code.slice(0, 5)}-${code.slice(5)}`;
  }

  private hashCode(code: string): string {
    return createHmac(
      "sha256",
      this.configService.getOrThrow<string>("AUTH_REFRESH_HMAC_SECRET"),
    )
      .update(`family-invite:${this.normalizeCode(code)}`)
      .digest("hex");
  }
}
