import {
  type CanActivate,
  type ExecutionContext,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { AppException } from "../common/app.exception";
import type { RequestContext } from "../common/request-context";
import { PrismaService } from "../prisma/prisma.service";

interface AccessTokenPayload {
  sub: string;
  sid: string;
  typ: "access";
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestContext>();
    const authorization = request.header("authorization");
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
    if (!token) {
      throw new AppException("AUTH_REQUIRED", "请先登录", HttpStatus.UNAUTHORIZED);
    }

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: this.configService.getOrThrow<string>("AUTH_JWT_SECRET"),
      });
    } catch {
      throw new AppException("AUTH_TOKEN_INVALID", "登录状态已失效，请重新登录", HttpStatus.UNAUTHORIZED);
    }

    if (payload.typ !== "access" || !payload.sub || !payload.sid) {
      throw new AppException("AUTH_TOKEN_INVALID", "登录状态已失效，请重新登录", HttpStatus.UNAUTHORIZED);
    }

    const session = await this.prisma.authSession.findUnique({
      where: { id: payload.sid },
      select: { userId: true, revokedAt: true, expiresAt: true },
    });
    if (
      !session
      || session.userId !== payload.sub
      || session.revokedAt
      || session.expiresAt.getTime() <= Date.now()
    ) {
      throw new AppException("AUTH_SESSION_EXPIRED", "登录会话已过期，请重新登录", HttpStatus.UNAUTHORIZED);
    }

    request.auth = { userId: payload.sub, sessionId: payload.sid };
    return true;
  }
}
