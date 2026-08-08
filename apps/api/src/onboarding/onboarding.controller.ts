import type { BootstrapContract } from "@baby-companion/contracts";
import { Body, Controller, Headers, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { AuthContext } from "../common/request-context";
import { OnboardingDto } from "./dto/onboarding.dto";
import { OnboardingService } from "./onboarding.service";

@ApiTags("onboarding")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("onboarding")
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiHeader({ name: "Idempotency-Key", required: true })
  @ApiOperation({ summary: "原子创建家庭、管理员成员关系和宝宝" })
  createFamilyContext(
    @CurrentUser() context: AuthContext,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Body() input: OnboardingDto,
  ): Promise<BootstrapContract> {
    return this.onboardingService.createFamilyContext(context.userId, idempotencyKey, input);
  }
}
