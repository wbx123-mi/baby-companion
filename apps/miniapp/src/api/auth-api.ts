import type {
  AuthTokensContract,
  BootstrapContract,
  FamilyInviteContract,
  FamilyMemberContract,
  OnboardingContract,
  UserContract,
} from "@baby-companion/contracts";
import { HttpApiError, rawRequest, type HttpRequestOptions } from "./http";
import {
  clearTokens,
  getAccessToken,
  getDevelopmentIdentity,
  getDeviceId,
  getRefreshToken,
  saveTokens,
  setDevelopmentIdentity,
  type DevelopmentIdentity,
} from "@/services/auth/token-storage";

const USE_DEV_LOGIN = import.meta.env.DEV && import.meta.env.VITE_USE_DEV_LOGIN !== "false";
let recoveryPromise: Promise<void> | null = null;

async function login(): Promise<void> {
  const deviceId = getDeviceId();
  const developmentIdentity = getDevelopmentIdentity();
  const tokens = USE_DEV_LOGIN
    ? await rawRequest<AuthTokensContract>({
        path: "/auth/dev-login",
        method: "POST",
        data: { ...developmentIdentity, deviceId },
      })
    : await rawRequest<AuthTokensContract>({
        path: "/auth/wechat/login",
        method: "POST",
        data: { code: await getWechatLoginCode(), deviceId },
      });
  saveTokens(tokens);
}

async function getWechatLoginCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: "weixin",
      success(result) {
        if (result.code) resolve(result.code);
        else reject(new HttpApiError(0, "WECHAT_LOGIN_FAILED", "没有获取到微信登录凭证"));
      },
      fail(error) {
        reject(new HttpApiError(0, "WECHAT_LOGIN_FAILED", error.errMsg || "微信登录失败"));
      },
    });
  });
}

async function refresh(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new HttpApiError(401, "AUTH_REQUIRED", "请先登录");
  const tokens = await rawRequest<AuthTokensContract>({
    path: "/auth/refresh",
    method: "POST",
    data: { refreshToken },
  });
  saveTokens(tokens);
}

async function recoverSession(): Promise<void> {
  if (!recoveryPromise) {
    recoveryPromise = (async () => {
      try {
        await refresh();
        return;
      } catch {
        clearTokens();
      }
      await login();
    })().finally(() => {
      recoveryPromise = null;
    });
  }
  return recoveryPromise;
}

export async function authenticatedRequest<T>(options: Omit<HttpRequestOptions, "accessToken">): Promise<T> {
  if (!getAccessToken()) await recoverSession();
  try {
    return await rawRequest<T>({ ...options, accessToken: getAccessToken() });
  } catch (error) {
    if (!(error instanceof HttpApiError) || error.statusCode !== 401) throw error;
    await recoverSession();
    return rawRequest<T>({ ...options, accessToken: getAccessToken() });
  }
}

export const authApi = {
  isDevelopmentLoginEnabled: USE_DEV_LOGIN,

  getDevelopmentIdentity,

  getBootstrap(): Promise<BootstrapContract> {
    return authenticatedRequest({ path: "/bootstrap" });
  },

  onboarding(input: OnboardingContract, idempotencyKey: string): Promise<BootstrapContract> {
    return authenticatedRequest({
      path: "/onboarding",
      method: "POST",
      data: input,
      headers: { "Idempotency-Key": idempotencyKey },
    });
  },

  createFamilyInvite(familyId: string): Promise<FamilyInviteContract> {
    return authenticatedRequest({
      path: `/families/${familyId}/invites`,
      method: "POST",
    });
  },

  getFamilyMembers(familyId: string): Promise<FamilyMemberContract[]> {
    return authenticatedRequest({ path: `/families/${familyId}/members` });
  },

  updateNickname(nickname: string): Promise<UserContract> {
    return authenticatedRequest({ path: "/me", method: "PUT", data: { nickname } });
  },

  joinFamily(code: string): Promise<BootstrapContract> {
    return authenticatedRequest({
      path: "/family-invites/join",
      method: "POST",
      data: { code },
    });
  },

  async switchDevelopmentIdentity(identity: DevelopmentIdentity): Promise<void> {
    if (!USE_DEV_LOGIN) throw new Error("仅开发环境支持切换身份");
    const accessToken = getAccessToken();
    if (accessToken) {
      try {
        await rawRequest<null>({ path: "/auth/logout", method: "POST", accessToken });
      } catch {
        // 开发身份切换不应被旧会话注销失败阻塞。
      }
    }
    clearTokens();
    setDevelopmentIdentity(identity);
    await login();
  },

  async logout(): Promise<void> {
    try {
      await authenticatedRequest<null>({ path: "/auth/logout", method: "POST" });
    } finally {
      clearTokens();
    }
  },
};
