export type UploadImageKind = "RECORD" | "AVATAR";

export interface PreparedUploadImage {
  filePath: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  sizeBytes: number;
  width: number;
  height: number;
}

const IMAGE_RULES: Record<UploadImageKind, { maxEdge: number; quality: number; maxBytes: number; sizeLabel: string }> = {
  RECORD: { maxEdge: 1920, quality: 80, maxBytes: 5 * 1024 * 1024, sizeLabel: "5MB" },
  AVATAR: { maxEdge: 512, quality: 80, maxBytes: 2 * 1024 * 1024, sizeLabel: "2MB" },
};

export async function prepareUploadImage(filePath: string, kind: UploadImageKind): Promise<PreparedUploadImage> {
  const rule = IMAGE_RULES[kind];
  const original = await getImageInfo(filePath);
  const compressedPath = await compressImage(filePath, original.width, original.height, rule.maxEdge, rule.quality);
  const [image, file] = await Promise.all([getImageInfo(compressedPath), getFileInfo(compressedPath)]);

  if (file.size > rule.maxBytes) {
    throw new Error(`图片压缩后仍超过 ${rule.sizeLabel}，请换一张图片`);
  }

  return {
    filePath: compressedPath,
    mimeType: getMimeType(compressedPath, image.type),
    sizeBytes: file.size,
    width: image.width,
    height: image.height,
  };
}

function compressImage(src: string, width: number, height: number, maxEdge: number, quality: number): Promise<string> {
  const dimension = width >= height
    ? { compressedWidth: Math.min(width, maxEdge) }
    : { compressedHeight: Math.min(height, maxEdge) };

  return new Promise((resolve, reject) => {
    uni.compressImage({
      src,
      quality,
      ...dimension,
      success: ({ tempFilePath }) => resolve(tempFilePath),
      fail: reject,
    });
  });
}

function getImageInfo(src: string): Promise<{ width: number; height: number; type?: string }> {
  return new Promise((resolve, reject) => {
    uni.getImageInfo({
      src,
      success: ({ width, height, type }) => resolve({ width, height, type }),
      fail: reject,
    });
  });
}

function getFileInfo(filePath: string): Promise<{ size: number }> {
  return new Promise((resolve, reject) => {
    uni.getFileInfo({ filePath, success: ({ size }) => resolve({ size }), fail: reject });
  });
}

function getMimeType(filePath: string, imageType?: string): "image/jpeg" | "image/png" | "image/webp" {
  const format = imageType?.toLowerCase() || filePath.split(".").pop()?.toLowerCase();
  if (format === "png") return "image/png";
  if (format === "webp") return "image/webp";
  return "image/jpeg";
}
