import type { ApiFailure } from "@baby-companion/contracts";
import {
  ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";
import { AppException } from "./app.exception";
import type { RequestContext } from "./request-context";

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestContext>();
    const response = http.getResponse<Response>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = this.buildBody(exception, request.requestId);
    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url}`, exception instanceof Error ? exception.stack : undefined);
    }
    response.status(status).json(body);
  }

  private buildBody(exception: unknown, requestId: string): ApiFailure {
    if (exception instanceof AppException) {
      return {
        code: exception.code,
        message: exception.message,
        details: exception.details,
        requestId,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const responseObject = typeof response === "object" && response !== null
        ? response as Record<string, unknown>
        : {};
      const rawMessage = responseObject.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join("；")
        : typeof rawMessage === "string"
          ? rawMessage
          : exception.message;

      return {
        code: status === HttpStatus.BAD_REQUEST ? "VALIDATION_FAILED" : "HTTP_ERROR",
        message,
        requestId,
      };
    }

    return {
      code: "INTERNAL_ERROR",
      message: "服务暂时不可用，请稍后重试",
      requestId,
    };
  }
}
