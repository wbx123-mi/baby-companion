import type { BabyContract, FamilySummaryContract } from "@baby-companion/contracts";
import { HttpStatus, Injectable } from "@nestjs/common";
import { AppException } from "../common/app.exception";
import { MediaService } from "../media/media.service";
import { PrismaService } from "../prisma/prisma.service";
import type { UpdateBabyDto } from "./dto/update-baby.dto";
import type { UpdateFamilyDto } from "./dto/update-family.dto";

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

  async updateFamily(userId: string, familyId: string, input: UpdateFamilyDto): Promise<FamilySummaryContract> {
    const membership = await this.prisma.familyMember.findFirst({ where: { userId, familyId, status: "ACTIVE", role: "ADMIN", family: { status: "ACTIVE" } }, select: { role: true } });
    if (!membership) throw new AppException("FAMILY_ADMIN_REQUIRED", "仅家庭管理员可以修改家庭名称", HttpStatus.FORBIDDEN);
    const family = await this.prisma.family.update({ where: { id: familyId }, data: { name: input.name.trim() } });
    return { id: family.id, name: family.name, role: membership.role, status: "ACTIVE" };
  }

  async updateBaby(userId: string, babyId: string, input: UpdateBabyDto): Promise<BabyContract> {
    const birthDate = new Date(`${input.birthDate}T00:00:00.000Z`);
    if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) throw new AppException("INVALID_BIRTH_DATE", "出生日期不正确", HttpStatus.BAD_REQUEST);
    const baby = await this.prisma.baby.findFirst({ where: { id: babyId, status: "ACTIVE", family: { status: "ACTIVE" } } });
    if (!baby) throw new AppException("BABY_NOT_FOUND", "宝宝档案不存在", HttpStatus.NOT_FOUND);
    const membership = await this.prisma.familyMember.findFirst({ where: { userId, familyId: baby.familyId, status: "ACTIVE" }, select: { id: true } });
    if (!membership) throw new AppException("FAMILY_ACCESS_DENIED", "你还没有加入这个家庭", HttpStatus.FORBIDDEN);
    const birthTime = input.birthTime ? new Date(`1970-01-01T${input.birthTime.length === 5 ? `${input.birthTime}:00` : input.birthTime}.000Z`) : null;
    const updated = await this.prisma.baby.updateMany({ where: { id: babyId, version: input.version }, data: { nickname: input.nickname.trim(), birthDate, birthTime, timezone: input.timezone, gender: input.gender, introduction: input.introduction?.trim() || null, version: { increment: 1 } } });
    if (updated.count !== 1) throw new AppException("BABY_VERSION_CONFLICT", "宝宝档案已被其他家人修改，请刷新后重试", HttpStatus.CONFLICT);
    const result = await this.prisma.baby.findUniqueOrThrow({
      where: { id: babyId },
      include: { avatarAsset: { select: { objectKey: true, status: true } } },
    });
    return {
      id: result.id,
      familyId: result.familyId,
      nickname: result.nickname,
      avatarUrl: result.avatarAsset?.status === "READY"
        ? await this.mediaService.getReadUrl(result.avatarAsset.objectKey)
        : null,
      birthDate: this.formatDate(result.birthDate),
      birthTime: result.birthTime ? this.formatTime(result.birthTime) : null,
      timezone: result.timezone,
      gender: result.gender,
      introduction: result.introduction,
      version: result.version,
    };
  }

  private formatDate(date: Date): string { return date.toISOString().slice(0, 10); }
  private formatTime(date: Date): string { return date.toISOString().slice(11, 19); }
}
