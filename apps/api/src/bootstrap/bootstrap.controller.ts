import type { BootstrapContract } from "@baby-companion/contracts";
import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { AuthContext } from "../common/request-context";
import { BootstrapService } from "./bootstrap.service";

@ApiTags("bootstrap")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("bootstrap")
export class BootstrapController {
  constructor(private readonly bootstrapService: BootstrapService) {}

  @Get()
  @ApiOperation({ summary: "恢复当前用户的家庭与宝宝上下文" })
  getContext(@CurrentUser() context: AuthContext): Promise<BootstrapContract> {
    return this.bootstrapService.getContext(context.userId);
  }
}
