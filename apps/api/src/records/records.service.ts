import type { GrowthRecordContract, RecordType } from "@baby-companion/contracts";
import { HttpStatus, Injectable } from "@nestjs/common";
import { ulid } from "ulid";
import { AppException } from "../common/app.exception";
import { PrismaService } from "../prisma/prisma.service";
import { MediaService } from "../media/media.service";
import type { CreateRecordDto } from "./dto/create-record.dto";
import type { DeleteRecordDto } from "./dto/delete-record.dto";
import type { ListRecordsDto } from "./dto/list-records.dto";
import type { UpdateRecordDto } from "./dto/update-record.dto";

@Injectable()
export class RecordsService {
  constructor(private readonly prisma: PrismaService, private readonly mediaService: MediaService) {}

  async list(userId: string, input: ListRecordsDto): Promise<GrowthRecordContract[]> {
    const context = await this.getBabyContext(userId, input.babyId);
    const occurredAt = input.month ? this.getMonthRange(input.month) : undefined;
    const records = await this.prisma.growthRecord.findMany({
      where: {
        familyId: context.familyId,
        babyId: input.babyId,
        status: "ACTIVE",
        ...(input.type ? { type: input.type } : {}),
        ...(occurredAt ? { occurredAt } : {}),
      },
      include: { creator: { select: { id: true, nickname: true, avatarUrl: true } }, assets: { include: { mediaAsset: true }, orderBy: { sortOrder: "asc" } } },
      orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
    });
    return Promise.all(records.map((record) => this.mapRecord(record)));
  }

  async getById(userId: string, recordId: string): Promise<GrowthRecordContract> {
    const record = await this.findActiveRecord(recordId);
    await this.assertFamilyMember(userId, record.familyId);
    return this.mapRecord(record);
  }

  async create(userId: string, input: CreateRecordDto): Promise<GrowthRecordContract> {
    const content = this.requireContent(input.content);
    const occurredAt = this.parseOccurredAt(input.occurredAt);
    const context = await this.getBabyContext(userId, input.babyId);

    if (input.clientRequestId) {
      const existing = await this.prisma.growthRecord.findUnique({
        where: { creatorUserId_clientRequestId: { creatorUserId: userId, clientRequestId: input.clientRequestId } },
        include: { creator: { select: { id: true, nickname: true, avatarUrl: true } }, assets: { include: { mediaAsset: true }, orderBy: { sortOrder: "asc" } } },
      });
      if (existing) return this.mapRecord(existing);
    }

    const record = await this.prisma.growthRecord.create({
      data: {
        id: ulid(),
        familyId: context.familyId,
        babyId: input.babyId,
        creatorUserId: userId,
        type: input.type,
        content,
        occurredAt,
        clientRequestId: input.clientRequestId,
      },
      include: { creator: { select: { id: true, nickname: true, avatarUrl: true } }, assets: { include: { mediaAsset: true }, orderBy: { sortOrder: "asc" } } },
    });
    await this.replaceAssets(record.id, context.familyId, input.babyId, userId, input.assetIds || []);
    return this.getById(userId, record.id);
  }

  async update(userId: string, recordId: string, input: UpdateRecordDto): Promise<GrowthRecordContract> {
    const content = this.requireContent(input.content);
    const occurredAt = this.parseOccurredAt(input.occurredAt);
    const record = await this.findActiveRecord(recordId);
    await this.assertFamilyMember(userId, record.familyId);

    const updated = await this.prisma.growthRecord.updateMany({
      where: { id: recordId, status: "ACTIVE", version: input.version },
      data: { type: input.type, content, occurredAt, version: { increment: 1 } },
    });
    if (updated.count !== 1) {
      throw new AppException("RECORD_VERSION_CONFLICT", "记录已被其他家人修改，请刷新后重试", HttpStatus.CONFLICT);
    }
    await this.replaceAssets(recordId, record.familyId, record.babyId, userId, input.assetIds ?? record.assets.map((asset) => asset.mediaAssetId));
    return this.getById(userId, recordId);
  }

  async remove(userId: string, recordId: string, input: DeleteRecordDto): Promise<null> {
    const record = await this.findActiveRecord(recordId);
    await this.assertFamilyMember(userId, record.familyId);
    const deleted = await this.prisma.growthRecord.updateMany({
      where: { id: recordId, status: "ACTIVE", version: input.version },
      data: { status: "DELETED", deletedAt: new Date(), version: { increment: 1 } },
    });
    if (deleted.count !== 1) {
      throw new AppException("RECORD_VERSION_CONFLICT", "记录已被其他家人修改，请刷新后重试", HttpStatus.CONFLICT);
    }
    return null;
  }

  private async getBabyContext(userId: string, babyId: string): Promise<{ familyId: string }> {
    const baby = await this.prisma.baby.findFirst({
      where: { id: babyId, status: "ACTIVE", family: { status: "ACTIVE" } },
      select: { familyId: true },
    });
    if (!baby) throw new AppException("BABY_NOT_FOUND", "宝宝档案不存在", HttpStatus.NOT_FOUND);
    await this.assertFamilyMember(userId, baby.familyId);
    return baby;
  }

  private async assertFamilyMember(userId: string, familyId: string): Promise<void> {
    const membership = await this.prisma.familyMember.findFirst({
      where: { userId, familyId, status: "ACTIVE", family: { status: "ACTIVE" } },
      select: { id: true },
    });
    if (!membership) {
      throw new AppException("FAMILY_ACCESS_DENIED", "你还没有加入这个家庭", HttpStatus.FORBIDDEN);
    }
  }

  private async findActiveRecord(recordId: string) {
    const record = await this.prisma.growthRecord.findFirst({
      where: { id: recordId, status: "ACTIVE" },
      include: { creator: { select: { id: true, nickname: true, avatarUrl: true } }, assets: { include: { mediaAsset: true }, orderBy: { sortOrder: "asc" } } },
    });
    if (!record) throw new AppException("RECORD_NOT_FOUND", "这条记录不存在或已删除", HttpStatus.NOT_FOUND);
    return record;
  }

  private requireContent(rawContent: string): string {
    const content = rawContent.trim();
    if (!content) throw new AppException("RECORD_CONTENT_REQUIRED", "请写下一点成长故事", HttpStatus.BAD_REQUEST);
    return content;
  }

  private parseOccurredAt(value: string): Date {
    const occurredAt = new Date(value);
    if (Number.isNaN(occurredAt.getTime()) || occurredAt.getTime() > Date.now() + 60_000) {
      throw new AppException("RECORD_TIME_INVALID", "发生时间不正确", HttpStatus.BAD_REQUEST);
    }
    return occurredAt;
  }

  private getMonthRange(month: string): { gte: Date; lt: Date } {
    const [year, monthNumber] = month.split("-").map(Number);
    const start = new Date(Date.UTC(year, monthNumber - 1, 1));
    const end = new Date(Date.UTC(year, monthNumber, 1));
    return { gte: start, lt: end };
  }

  private async mapRecord(record: {
    id: string;
    familyId: string;
    babyId: string;
    type: RecordType;
    content: string;
    occurredAt: Date;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    creator: { id: string; nickname: string | null; avatarUrl: string | null };
    assets: Array<{ sortOrder: number; mediaAsset: { id: string; category: "IMAGE"; width: number | null; height: number | null; status: string; objectKey: string } }>;
  }): Promise<GrowthRecordContract> {
    return {
      id: record.id,
      familyId: record.familyId,
      babyId: record.babyId,
      type: record.type,
      content: record.content,
      occurredAt: record.occurredAt.toISOString(),
      creator: record.creator,
      assets: await Promise.all(record.assets.map(async (asset) => ({
        id: asset.mediaAsset.id,
        category: asset.mediaAsset.category,
        width: asset.mediaAsset.width || 0,
        height: asset.mediaAsset.height || 0,
        status: "READY",
        sortOrder: asset.sortOrder,
        accessUrl: await this.mediaService.getReadUrl(asset.mediaAsset.objectKey),
      }))),
      version: record.version,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  private async replaceAssets(recordId: string, familyId: string, babyId: string, userId: string, assetIds: string[]): Promise<void> {
    const uniqueIds = [...new Set(assetIds)];
    if (uniqueIds.length > 9) throw new AppException("RECORD_ASSET_LIMIT", "最多上传 9 张照片", HttpStatus.BAD_REQUEST);
    if (uniqueIds.length) {
      const assets = await this.prisma.mediaAsset.findMany({ where: { id: { in: uniqueIds }, familyId, babyId, uploaderUserId: userId, status: "READY" }, select: { id: true } });
      if (assets.length !== uniqueIds.length) throw new AppException("RECORD_ASSET_INVALID", "存在无效或未完成上传的照片", HttpStatus.BAD_REQUEST);
    }
    await this.prisma.$transaction([
      this.prisma.growthRecordAsset.deleteMany({ where: { growthRecordId: recordId } }),
      ...(uniqueIds.map((mediaAssetId, sortOrder) => this.prisma.growthRecordAsset.create({ data: { growthRecordId: recordId, mediaAssetId, sortOrder } }))),
    ]);
  }
}
