import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthContext, RequestContext } from "../common/request-context";

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthContext => {
    const request = context.switchToHttp().getRequest<RequestContext>();
    if (!request.auth) {
      throw new Error("CurrentUser requires JwtAuthGuard");
    }
    return request.auth;
  },
);
