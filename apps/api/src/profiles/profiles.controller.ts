import type { BabyContract, FamilySummaryContract } from "@baby-companion/contracts";
import { Body, Controller, Param, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { AuthContext } from "../common/request-context";
import { UpdateBabyDto } from "./dto/update-baby.dto";
import { UpdateFamilyDto } from "./dto/update-family.dto";
import { ProfilesService } from "./profiles.service";

@ApiTags("profiles") @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller()
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}
  @Put("families/:familyId") @ApiOperation({ summary: "更新家庭名称（仅管理员）" })
  updateFamily(@CurrentUser() context: AuthContext, @Param("familyId") familyId: string, @Body() input: UpdateFamilyDto): Promise<FamilySummaryContract> { return this.profiles.updateFamily(context.userId, familyId, input); }
  @Put("babies/:babyId") @ApiOperation({ summary: "更新宝宝档案" })
  updateBaby(@CurrentUser() context: AuthContext, @Param("babyId") babyId: string, @Body() input: UpdateBabyDto): Promise<BabyContract> { return this.profiles.updateBaby(context.userId, babyId, input); }
}
