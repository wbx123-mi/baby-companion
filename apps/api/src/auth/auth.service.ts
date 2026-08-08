import type { AuthTokensContract, UserContract } from "@baby-companion/contracts";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { ulid } from "ulid";
import { AppException } from "../common/app.exception";
import type { AuthContext } from "../common/request-context";
import { PrismaService } from "../prisma/prisma.service";
import type { DevLoginDto } from "./dto/dev-login.dto";

interface WechatSessionResponse {
  openid?: string;
  unionid?: string;
  session_key?: string;
  errcode?: number;
  errmsg?: string;
}

interface RefreshTokenParts {
  id: string;
  secret: string;
}

interface UserIdentityInput {
  appId: string;
  subject: string;
  unionId?: string;
  nickname?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async loginWithWechat(code: string, deviceId?: string): Promise<AuthTokensContract> {
    const appId = this.configService.get<string>("WECHAT_APP_ID");
    const appSecret = this.configService.get<string>("WECHAT_APP_SECRET");
    if (!appId || !appSecret) {
      throw new AppException(
        "WECHAT_NOT_CONFIGURED",
        "微信登录尚未配置，请联系管理员",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const query = new URLSearchParams({
      appid: appId,
      secret: appSecret,
      js_code: code,
      grant_type: "authorization_code",
    });
    let response: Response;
    let result: WechatSessionResponse;
    try {
      response = await fetch(`https://api.weixin.qq.com/sns/jscode2session?${query.toString()}`);
      result = await response.json() as WechatSessionResponse;
    } catch {
      throw new AppException(
        "WECHAT_SERVICE_UNAVAILABLE",
        "微信登录服务暂时不可用，请稍后重试",
        HttpStatus.BAD_GATEWAY,
      );
    }
    if (!response.ok || result.errcode || !result.openid) {
      throw new AppException(
        "WECHAT_LOGIN_FAILED",
        "微信登录失败，请重新打开小程序",
        HttpStatus.UNAUTHORIZED,
        result.errcode ? { wechatErrorCode: result.errcode } : undefined,
      );
    }

    const user = await this.findOrCreateUser({
      appId,
      subject: result.openid,
      unionId: result.unionid,
    });
    return this.issueSession(user, deviceId);
  }

  async loginForDevelopment(input: DevLoginDto): Promise<AuthTokensContract> {
    if (this.configService.get<string>("NODE_ENV", "development") !== "development") {
      throw new AppException("NOT_FOUND", "接口不存在", HttpStatus.NOT_FOUND);
    }

    const nickname = input.nickname || "家人";
    const user = await this.findOrCreateUser({
      appId: "development",
      subject: `dev:${input.subject || "local-owner"}`,
      nickname,
    });
    const currentUser = user.nickname === nickname
      ? user
      : await this.prisma.user.update({ where: { id: user.id }, data: { nickname } });
    return this.issueSession(currentUser, input.deviceId);
  }

  async refresh(refreshToken: string): Promise<AuthTokensContract> {
    const parts = this.parseRefreshToken(refreshToken);
    const now = new Date();
    const nextToken = this.createRefreshToken();

    const result = await this.prisma.$transaction(async (transaction) => {
      const current = await transaction.authRefreshToken.findUnique({
        where: { id: parts.id },
        include: { session: { include: { user: true } } },
      });
      if (!current || !this.matchesRefreshSecret(parts.secret, current.tokenHash)) {
        return { kind: "invalid" as const };
      }

      const sessionExpired = current.session.expiresAt.getTime() <= now.getTime();
      if (current.session.revokedAt || sessionExpired || current.expiresAt.getTime() <= now.getTime()) {
        return { kind: "expired" as const };
      }

      if (current.status !== "ACTIVE") {
        await transaction.authSession.update({
          where: { id: current.sessionId },
          data: { revokedAt: now },
        });
        await transaction.authRefreshToken.updateMany({
          where: { sessionId: current.sessionId, status: "ACTIVE" },
          data: { status: "REVOKED", revokedAt: now },
        });
        return { kind: "reused" as const };
      }

      await transaction.authRefreshToken.create({
        data: {
          id: nextToken.id,
          sessionId: current.sessionId,
          tokenHash: nextToken.hash,
          status: "ACTIVE",
          expiresAt: current.session.expiresAt,
        },
      });
      const rotated = await transaction.authRefreshToken.updateMany({
        where: { id: current.id, status: "ACTIVE" },
        data: {
          status: "ROTATED",
          usedAt: now,
          replacedByTokenId: nextToken.id,
        },
      });
      if (rotated.count !== 1) {
        await transaction.authRefreshToken.delete({ where: { id: nextToken.id } });
        await transaction.authSession.update({
          where: { id: current.sessionId },
          data: { revokedAt: now },
        });
        return { kind: "reused" as const };
      }

      await transaction.authSession.update({
        where: { id: current.sessionId },
        data: { lastUsedAt: now },
      });

      return {
        kind: "success" as const,
        user: current.session.user,
        sessionId: current.sessionId,
        sessionExpiresAt: current.session.expiresAt,
      };
    });

    if (result.kind === "reused") {
      throw new AppException(
        "AUTH_REFRESH_REUSED",
        "检测到登录凭证重复使用，请重新登录",
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (result.kind !== "success") {
      throw new AppException(
        result.kind === "expired" ? "AUTH_SESSION_EXPIRED" : "AUTH_TOKEN_INVALID",
        "登录状态已失效，请重新登录",
        HttpStatus.UNAUTHORIZED,
      );
    }

    return this.buildTokenResponse(
      result.user,
      result.sessionId,
      result.sessionExpiresAt,
      nextToken.value,
    );
  }

  async logout(context: AuthContext): Promise<null> {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.authSession.updateMany({
        where: { id: context.sessionId, userId: context.userId, revokedAt: null },
        data: { revokedAt: now },
      }),
      this.prisma.authRefreshToken.updateMany({
        where: { sessionId: context.sessionId, status: "ACTIVE" },
        data: { status: "REVOKED", revokedAt: now },
      }),
    ]);
    return null;
  }

  async getCurrentUser(userId: string): Promise<UserContract> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== "ACTIVE") {
      throw new AppException("USER_UNAVAILABLE", "当前账号不可用", HttpStatus.FORBIDDEN);
    }
    return this.toUserContract(user);
  }

  async updateNickname(userId: string, rawNickname: string): Promise<UserContract> {
    const nickname = rawNickname.trim();
    if (!nickname) {
      throw new AppException("NICKNAME_REQUIRED", "请输入家庭昵称", HttpStatus.BAD_REQUEST);
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { nickname },
    });
    return this.toUserContract(user);
  }

  private async findOrCreateUser(input: UserIdentityInput) {
    const now = new Date();
    return this.prisma.$transaction(async (transaction) => {
      const identity = await transaction.userIdentity.findUnique({
        where: {
          provider_appId_subject: {
            provider: "WECHAT_MINI_PROGRAM",
            appId: input.appId,
            subject: input.subject,
          },
        },
        include: { user: true },
      });
      if (identity) {
        await transaction.userIdentity.update({
          where: { id: identity.id },
          data: { unionId: input.unionId, lastLoginAt: now },
        });
        if (identity.user.status !== "ACTIVE") {
          throw new AppException("USER_DISABLED", "当前账号已停用", HttpStatus.FORBIDDEN);
        }
        if (!identity.user.nickname && input.nickname) {
          return transaction.user.update({
            where: { id: identity.userId },
            data: { nickname: input.nickname },
          });
        }
        return identity.user;
      }

      return transaction.user.create({
        data: {
          id: ulid(),
          nickname: input.nickname,
          status: "ACTIVE",
          identities: {
            create: {
              id: ulid(),
              provider: "WECHAT_MINI_PROGRAM",
              appId: input.appId,
              subject: input.subject,
              unionId: input.unionId,
              lastLoginAt: now,
            },
          },
        },
      });
    });
  }

  private async issueSession(
    user: { id: string; nickname: string | null; avatarUrl: string | null },
    deviceId?: string,
  ): Promise<AuthTokensContract> {
    const sessionTtlDays = this.getPositiveIntegerConfig("AUTH_SESSION_TTL_DAYS", 30);
    const sessionExpiresAt = new Date(Date.now() + sessionTtlDays * 86_400_000);
    const sessionId = ulid();
    const refreshToken = this.createRefreshToken();

    await this.prisma.authSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        deviceId,
        expiresAt: sessionExpiresAt,
        refreshTokens: {
          create: {
            id: refreshToken.id,
            tokenHash: refreshToken.hash,
            status: "ACTIVE",
            expiresAt: sessionExpiresAt,
          },
        },
      },
    });

    return this.buildTokenResponse(user, sessionId, sessionExpiresAt, refreshToken.value);
  }

  private async buildTokenResponse(
    user: { id: string; nickname: string | null; avatarUrl: string | null },
    sessionId: string,
    sessionExpiresAt: Date,
    refreshToken: string,
  ): Promise<AuthTokensContract> {
    const accessTokenExpiresIn = this.getPositiveIntegerConfig("JWT_ACCESS_TTL_SECONDS", 900);
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, sid: sessionId, typ: "access" },
      {
        secret: this.configService.getOrThrow<string>("AUTH_JWT_SECRET"),
        expiresIn: accessTokenExpiresIn,
      },
    );

    return {
      accessToken,
      accessTokenExpiresIn,
      refreshToken,
      refreshTokenExpiresIn: Math.max(0, Math.floor((sessionExpiresAt.getTime() - Date.now()) / 1000)),
      user: this.toUserContract(user),
    };
  }

  private createRefreshToken(): { id: string; secret: string; value: string; hash: string } {
    const id = ulid();
    const secret = randomBytes(32).toString("base64url");
    return { id, secret, value: `${id}.${secret}`, hash: this.hashRefreshSecret(secret) };
  }

  private parseRefreshToken(token: string): RefreshTokenParts {
    const [id, secret, extra] = token.split(".");
    if (!id || !secret || extra || id.length !== 26) {
      throw new AppException("AUTH_TOKEN_INVALID", "登录状态已失效，请重新登录", HttpStatus.UNAUTHORIZED);
    }
    return { id, secret };
  }

  private hashRefreshSecret(secret: string): string {
    return createHmac("sha256", this.configService.getOrThrow<string>("AUTH_REFRESH_HMAC_SECRET"))
      .update(secret)
      .digest("hex");
  }

  private matchesRefreshSecret(secret: string, expectedHash: string): boolean {
    const actual = Buffer.from(this.hashRefreshSecret(secret), "hex");
    const expected = Buffer.from(expectedHash, "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  private getPositiveIntegerConfig(key: string, fallback: number): number {
    const value = Number(this.configService.get<string | number>(key, fallback));
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new Error(`${key} must be a positive integer`);
    }
    return value;
  }

  private toUserContract(user: { id: string; nickname: string | null; avatarUrl: string | null }): UserContract {
    return { id: user.id, nickname: user.nickname, avatarUrl: user.avatarUrl };
  }
}
