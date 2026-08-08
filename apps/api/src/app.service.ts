import { Injectable } from "@nestjs/common";

export interface ServiceInfo {
  name: string;
  version: string;
  status: "ok";
}

@Injectable()
export class AppService {
  getServiceInfo(): ServiceInfo {
    return {
      name: "baby-companion-api",
      version: "0.1.0",
      status: "ok",
    };
  }
}
