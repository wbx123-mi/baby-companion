import type { ApiSuccess } from "@baby-companion/contracts";
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";
import type { Observable } from "rxjs";
import { map } from "rxjs/operators";
import type { RequestContext } from "./request-context";

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T, ApiSuccess<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccess<T>> {
    const request = context.switchToHttp().getRequest<RequestContext>();
    return next.handle().pipe(
      map((data) => ({
        data,
        requestId: request.requestId,
      })),
    );
  }
}
