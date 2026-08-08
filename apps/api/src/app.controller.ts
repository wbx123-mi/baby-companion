import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AppService, type ServiceInfo } from "./app.service";

@ApiTags("system")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: "获取 API 服务信息" })
  getServiceInfo(): ServiceInfo {
    return this.appService.getServiceInfo();
  }
}
