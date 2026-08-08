import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("live")
  @ApiOperation({ summary: "进程存活检查" })
  getLiveness(): { status: "ok" } {
    return { status: "ok" };
  }

  @Get("ready")
  @ApiOperation({ summary: "数据库依赖就绪检查" })
  async getReadiness(): Promise<{ status: "ok"; database: "up" }> {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: "ok", database: "up" };
  }
}
