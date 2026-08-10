import { authenticatedRequest } from "./auth-api";
import type { MediaAsset } from "@/types/domain";
import { prepareUploadImage } from "@/utils/image-upload";

interface UploadIntent { assetId: string; uploadUrl: string; formData: Record<string, string>; }
type AvatarTarget = "USER" | "BABY";

export const mediaApi = {
  async uploadImage(babyId: string, filePath: string): Promise<MediaAsset> {
    const image = await prepareUploadImage(filePath, "RECORD");
    const intent = await authenticatedRequest<UploadIntent>({ path: "/media/upload-intents", method: "POST", data: { babyId, mimeType: image.mimeType, sizeBytes: image.sizeBytes, width: image.width, height: image.height } });
    await uploadFile(intent, image.filePath);
    const asset = await authenticatedRequest<{ id: string; category: "IMAGE"; width: number; height: number; status: "READY"; sortOrder: number; accessUrl: string }>({ path: `/media/${intent.assetId}/complete`, method: "POST" });
    return { ...asset, url: asset.accessUrl, localPath: null };
  },

  async uploadAvatar(babyId: string, target: AvatarTarget, filePath: string): Promise<{ target: AvatarTarget; avatarUrl: string }> {
    const image = await prepareUploadImage(filePath, "AVATAR");
    const intent = await authenticatedRequest<UploadIntent>({
      path: "/media/avatar-upload-intents",
      method: "POST",
      data: { babyId, target, mimeType: image.mimeType, sizeBytes: image.sizeBytes, width: image.width, height: image.height },
    });
    await uploadFile(intent, image.filePath);
    return authenticatedRequest<{ target: AvatarTarget; avatarUrl: string }>({
      path: `/media/avatar-upload-intents/${intent.assetId}/complete`,
      method: "POST",
    });
  },
};

function uploadFile(intent: UploadIntent, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => uni.uploadFile({ url: intent.uploadUrl, filePath, name: "file", formData: intent.formData, success: ({ statusCode }) => statusCode >= 200 && statusCode < 300 ? resolve() : reject(new Error("图片上传失败")), fail: reject }));
}
