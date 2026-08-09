import { GetObjectCommand, HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ulid } from "ulid";
import { AppException } from "../common/app.exception";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateAvatarUploadIntentDto } from "./dto/create-avatar-upload-intent.dto";
import type { CreateUploadIntentDto } from "./dto/create-upload-intent.dto";

@Injectable()
export class MediaService {
  private readonly bucket: string;
  private readonly client: S3Client;
  private readonly signingClient: S3Client;

  constructor(private readonly prisma: PrismaService, config: ConfigService) {
    this.bucket = config.get<string>("S3_BUCKET") || "baby-companion";
    const region = config.get<string>("S3_REGION") || "us-east-1";
    const endpoint = config.get<string>("S3_ENDPOINT") || "http://127.0.0.1:9000";
    const credentials = {
      accessKeyId: config.get<string>("S3_ACCESS_KEY") || "baby_companion_minio",
      secretAccessKey: config.get<string>("S3_SECRET_KEY") || "local_minio_password",
    };
    this.client = new S3Client({
      region,
      endpoint,
      forcePathStyle: true,
      credentials,
    });
    this.signingClient = new S3Client({
      region,
      endpoint: config.get<string>("S3_PUBLIC_ENDPOINT") || endpoint,
      forcePathStyle: true,
      credentials,
    });
  }

  async createUploadIntent(userId: string, input: CreateUploadIntentDto) {
    const baby = await this.prisma.baby.findFirst({ where: { id: input.babyId, status: "ACTIVE", family: { status: "ACTIVE" } }, select: { familyId: true } });
    if (!baby) throw new AppException("BABY_NOT_FOUND", "宝宝档案不存在", HttpStatus.NOT_FOUND);
    await this.assertFamilyMember(userId, baby.familyId);
    const id = ulid();
    const extension = input.mimeType.split("/")[1];
    const objectKey = `families/${baby.familyId}/babies/${input.babyId}/images/${id}.${extension}`;
    const asset = await this.prisma.mediaAsset.create({ data: { id, familyId: baby.familyId, babyId: input.babyId, uploaderUserId: userId, category: "IMAGE", objectKey, mimeType: input.mimeType, sizeBytes: BigInt(input.sizeBytes), width: input.width, height: input.height, status: "PENDING", intentExpiresAt: new Date(Date.now() + 10 * 60_000) } });
    const upload = await createPresignedPost(this.signingClient, {
      Bucket: this.bucket,
      Key: objectKey,
      Fields: { "Content-Type": input.mimeType },
      Conditions: [["content-length-range", 1, 10 * 1024 * 1024], ["eq", "$Content-Type", input.mimeType]],
      Expires: 600,
    });
    return { assetId: asset.id, uploadUrl: upload.url, formData: upload.fields };
  }

  async createAvatarUploadIntent(userId: string, input: CreateAvatarUploadIntentDto) {
    const baby = await this.prisma.baby.findFirst({
      where: { id: input.babyId, status: "ACTIVE", family: { status: "ACTIVE" } },
      select: { id: true, familyId: true },
    });
    if (!baby) throw new AppException("BABY_NOT_FOUND", "宝宝档案不存在", HttpStatus.NOT_FOUND);
    await this.assertFamilyMember(userId, baby.familyId);

    const id = ulid();
    const extension = input.mimeType.split("/")[1];
    const ownerId = input.target === "USER" ? userId : baby.id;
    const objectKey = `families/${baby.familyId}/babies/${baby.id}/avatars/${input.target.toLowerCase()}/${ownerId}/${id}.${extension}`;
    const asset = await this.prisma.mediaAsset.create({
      data: {
        id,
        familyId: baby.familyId,
        babyId: baby.id,
        uploaderUserId: userId,
        category: input.target === "USER" ? "USER_AVATAR" : "BABY_AVATAR",
        objectKey,
        mimeType: input.mimeType,
        sizeBytes: BigInt(input.sizeBytes),
        width: input.width,
        height: input.height,
        status: "PENDING",
        intentExpiresAt: new Date(Date.now() + 10 * 60_000),
      },
    });
    const upload = await createPresignedPost(this.signingClient, {
      Bucket: this.bucket,
      Key: objectKey,
      Fields: { "Content-Type": input.mimeType },
      Conditions: [["content-length-range", 1, 10 * 1024 * 1024], ["eq", "$Content-Type", input.mimeType]],
      Expires: 600,
    });
    return { assetId: asset.id, uploadUrl: upload.url, formData: upload.fields };
  }

  async completeUpload(userId: string, assetId: string) {
    const asset = await this.prisma.mediaAsset.findFirst({ where: { id: assetId, uploaderUserId: userId, status: "PENDING" } });
    if (!asset) throw new AppException("MEDIA_ASSET_NOT_FOUND", "上传任务不存在或已失效", HttpStatus.NOT_FOUND);
    await this.assertFamilyMember(userId, asset.familyId);
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: asset.objectKey }));
    } catch {
      throw new AppException("MEDIA_OBJECT_NOT_FOUND", "图片尚未上传完成", HttpStatus.BAD_REQUEST);
    }
    const updated = await this.prisma.mediaAsset.update({ where: { id: assetId }, data: { status: "READY", uploadedAt: new Date(), intentExpiresAt: null } });
    return { id: updated.id, category: updated.category, width: updated.width || 0, height: updated.height || 0, status: "READY" as const, sortOrder: 0, accessUrl: await this.getReadUrl(updated.objectKey) };
  }

  async completeAvatarUpload(userId: string, assetId: string) {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: {
        id: assetId,
        uploaderUserId: userId,
        status: "PENDING",
        category: { in: ["USER_AVATAR", "BABY_AVATAR"] },
      },
    });
    if (!asset) throw new AppException("MEDIA_ASSET_NOT_FOUND", "头像上传任务不存在或已失效", HttpStatus.NOT_FOUND);
    await this.assertFamilyMember(userId, asset.familyId);
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: asset.objectKey }));
    } catch {
      throw new AppException("MEDIA_OBJECT_NOT_FOUND", "图片尚未上传完成", HttpStatus.BAD_REQUEST);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.mediaAsset.update({ where: { id: asset.id }, data: { status: "READY", uploadedAt: new Date(), intentExpiresAt: null } });
      if (asset.category === "USER_AVATAR") {
        await tx.user.update({ where: { id: userId }, data: { avatarAssetId: asset.id } });
      } else {
        await tx.baby.update({ where: { id: asset.babyId }, data: { avatarAssetId: asset.id } });
      }
    });
    return {
      target: asset.category === "USER_AVATAR" ? "USER" : "BABY",
      avatarUrl: await this.getReadUrl(asset.objectKey),
    };
  }

  async getReadUrlForAsset(userId: string, assetId: string): Promise<string> {
    const asset = await this.prisma.mediaAsset.findFirst({ where: { id: assetId, status: "READY" } });
    if (!asset) throw new AppException("MEDIA_ASSET_NOT_FOUND", "图片不存在", HttpStatus.NOT_FOUND);
    await this.assertFamilyMember(userId, asset.familyId);
    return this.getReadUrl(asset.objectKey);
  }

  getReadUrl(objectKey: string): Promise<string> {
    return getSignedUrl(this.signingClient, new GetObjectCommand({ Bucket: this.bucket, Key: objectKey }), { expiresIn: 3600 });
  }

  private async assertFamilyMember(userId: string, familyId: string): Promise<void> {
    const membership = await this.prisma.familyMember.findFirst({ where: { userId, familyId, status: "ACTIVE", family: { status: "ACTIVE" } }, select: { id: true } });
    if (!membership) throw new AppException("FAMILY_ACCESS_DENIED", "你还没有加入这个家庭", HttpStatus.FORBIDDEN);
  }
}
