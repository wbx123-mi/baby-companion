import { randomUUID } from "node:crypto";
import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Response } from "express";
import type { RequestContext } from "./request-context";

const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: RequestContext, response: Response, next: NextFunction): void {
    const candidate = request.header("x-request-id");
    request.requestId = candidate && REQUEST_ID_PATTERN.test(candidate) ? candidate : randomUUID();
    response.setHeader("x-request-id", request.requestId);
    next();
  }
}
