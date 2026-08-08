import type {
  BabyContract,
  BootstrapContract,
  FamilySummaryContract,
  Gender,
} from "@baby-companion/contracts";
import { HttpStatus, Injectable } from "@nestjs/common";
import { AppException } from "../common/app.exception";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BootstrapService {
  constructor(private readonly prisma: PrismaService) {}

  async getContext(userId: string): Promise<BootstrapContract> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        familyMembers: {
          where: { status: "ACTIVE", family: { status: "ACTIVE" } },
          orderBy: { joinedAt: "asc" },
          include: {
            family: {
              include: {
                babies: {
                  where: { status: "ACTIVE" },
                  orderBy: { createdAt: "asc" },
                },
              },
            },
          },
        },
      },
    });
    if (!user || user.status !== "ACTIVE") {
      throw new AppException("USER_UNAVAILABLE", "当前账号不可用", HttpStatus.FORBIDDEN);
    }

    const families: FamilySummaryContract[] = user.familyMembers.map((member) => ({
      id: member.family.id,
      name: member.family.name,
      role: member.role,
      status: "ACTIVE",
    }));

    if (user.familyMembers.length === 0) {
      return {
        user: this.mapUser(user),
        families,
        baby: null,
        currentContext: null,
        nextAction: "NO_FAMILY",
      };
    }

    const member = user.familyMembers[0];
    if (user.familyMembers.length !== 1 || member.family.babies.length !== 1) {
      return {
        user: this.mapUser(user),
        families,
        baby: null,
        currentContext: null,
        nextAction: "UNAVAILABLE",
      };
    }

    const baby = this.mapBaby(member.family.babies[0]);
    return {
      user: this.mapUser(user),
      families,
      baby,
      currentContext: { familyId: member.familyId, babyId: baby.id },
      nextAction: "ENTER_APP",
    };
  }

  private mapUser(user: { id: string; nickname: string | null; avatarUrl: string | null }) {
    return { id: user.id, nickname: user.nickname, avatarUrl: user.avatarUrl };
  }

  private mapBaby(baby: {
    id: string;
    familyId: string;
    nickname: string;
    birthDate: Date;
    birthTime: Date | null;
    timezone: string;
    gender: Gender;
    introduction: string | null;
    version: number;
  }): BabyContract {
    return {
      id: baby.id,
      familyId: baby.familyId,
      nickname: baby.nickname,
      birthDate: this.formatDate(baby.birthDate),
      birthTime: baby.birthTime ? this.formatTime(baby.birthTime) : null,
      timezone: baby.timezone,
      gender: baby.gender,
      introduction: baby.introduction,
      version: baby.version,
    };
  }

  private formatDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private formatTime(date: Date): string {
    const hour = String(date.getUTCHours()).padStart(2, "0");
    const minute = String(date.getUTCMinutes()).padStart(2, "0");
    const second = String(date.getUTCSeconds()).padStart(2, "0");
    return `${hour}:${minute}:${second}`;
  }
}
