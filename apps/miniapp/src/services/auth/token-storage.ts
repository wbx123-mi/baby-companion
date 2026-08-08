import type { AuthTokensContract } from "@baby-companion/contracts";

const ACCESS_TOKEN_KEY = "baby-companion:access-token";
const REFRESH_TOKEN_KEY = "baby-companion:refresh-token";
const DEVICE_ID_KEY = "baby-companion:device-id";
const DEV_IDENTITY_KEY = "baby-companion:dev-identity";

export interface DevelopmentIdentity {
  subject: string;
  nickname: string;
}

const DEFAULT_DEV_IDENTITY: DevelopmentIdentity = {
  subject: "local-owner",
  nickname: "家人",
};

export function getAccessToken(): string | null {
  return uni.getStorageSync(ACCESS_TOKEN_KEY) || null;
}

export function getRefreshToken(): string | null {
  return uni.getStorageSync(REFRESH_TOKEN_KEY) || null;
}

export function saveTokens(tokens: AuthTokensContract): void {
  uni.setStorageSync(ACCESS_TOKEN_KEY, tokens.accessToken);
  uni.setStorageSync(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearTokens(): void {
  uni.removeStorageSync(ACCESS_TOKEN_KEY);
  uni.removeStorageSync(REFRESH_TOKEN_KEY);
}

export function getDeviceId(): string {
  const saved = uni.getStorageSync(DEVICE_ID_KEY);
  if (saved) return saved;
  const deviceId = `device_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
  uni.setStorageSync(DEVICE_ID_KEY, deviceId);
  return deviceId;
}

export function getDevelopmentIdentity(): DevelopmentIdentity {
  const saved = uni.getStorageSync(DEV_IDENTITY_KEY) as DevelopmentIdentity | "";
  if (saved && saved.subject && saved.nickname === "小舅舅") {
    return { ...saved, nickname: "家人" };
  }
  return saved && saved.subject && saved.nickname ? saved : DEFAULT_DEV_IDENTITY;
}

export function setDevelopmentIdentity(identity: DevelopmentIdentity): void {
  uni.setStorageSync(DEV_IDENTITY_KEY, identity);
}
