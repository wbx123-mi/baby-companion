import { authenticatedRequest } from "./auth-api";
import type { MediaAsset } from "@/types/domain";

interface UploadIntent { assetId: string; uploadUrl: string; formData: Record<string, string>; }
type AvatarTarget = "USER" | "BABY";

export const mediaApi = {
  async uploadImage(babyId: string, filePath: string): Promise<MediaAsset> {
    const info = await getImageInfo(filePath);
    const file = await getFileInfo(filePath);
    const mimeType = getMimeType(filePath);
    const intent = await authenticatedRequest<UploadIntent>({ path: "/media/upload-intents", method: "POST", data: { babyId, mimeType, sizeBytes: file.size, width: info.width, height: info.height } });
    await uploadFile(intent, filePath);
    const asset = await authenticatedRequest<{ id: string; category: "IMAGE"; width: number; height: number; status: "READY"; sortOrder: number; accessUrl: string }>({ path: `/media/${intent.assetId}/complete`, method: "POST" });
    return { ...asset, url: asset.accessUrl, localPath: null };
  },

  async uploadAvatar(babyId: string, target: AvatarTarget, filePath: string): Promise<{ target: AvatarTarget; avatarUrl: string }> {
    const info = await getImageInfo(filePath);
    const file = await getFileInfo(filePath);
    const mimeType = getMimeType(filePath);
    const intent = await authenticatedRequest<UploadIntent>({
      path: "/media/avatar-upload-intents",
      method: "POST",
      data: { babyId, target, mimeType, sizeBytes: file.size, width: info.width, height: info.height },
    });
    await uploadFile(intent, filePath);
    return authenticatedRequest<{ target: AvatarTarget; avatarUrl: string }>({
      path: `/media/avatar-upload-intents/${intent.assetId}/complete`,
      method: "POST",
    });
  },
};

function getImageInfo(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => uni.getImageInfo({ src, success: ({ width, height }) => resolve({ width, height }), fail: reject }));
}
function getFileInfo(filePath: string): Promise<{ size: number }> {
  return new Promise((resolve, reject) => uni.getFileInfo({ filePath, success: ({ size }) => resolve({ size }), fail: reject }));
}
function uploadFile(intent: UploadIntent, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => uni.uploadFile({ url: intent.uploadUrl, filePath, name: "file", formData: intent.formData, success: ({ statusCode }) => statusCode >= 200 && statusCode < 300 ? resolve() : reject(new Error("图片上传失败")), fail: reject }));
}
function getMimeType(filePath: string): "image/jpeg" | "image/png" | "image/webp" {
  const extension = filePath.split(".").pop()?.toLowerCase();
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return "image/jpeg";
}
