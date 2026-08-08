import type {
  BootstrapContract,
  FamilyInviteContract,
  FamilyMemberContract,
} from "@baby-companion/contracts";
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { AuthContext } from "../common/request-context";
import { JoinFamilyDto } from "./dto/join-family.dto";
import { FamilyInvitesService } from "./family-invites.service";

@ApiTags("family-invites")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class FamilyInvitesController {
  constructor(private readonly familyInvitesService: FamilyInvitesService) {}

  @Get("families/:familyId/members")
  @ApiOperation({ summary: "查看当前家庭的有效成员" })
  getFamilyMembers(
    @CurrentUser() context: AuthContext,
    @Param("familyId") familyId: string,
  ): Promise<FamilyMemberContract[]> {
    return this.familyInvitesService.getFamilyMembers(context.userId, familyId);
  }

  @Post("families/:familyId/invites")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "家庭管理员生成新的 7 天邀请码，并撤销旧邀请码" })
  createInvite(
    @CurrentUser() context: AuthContext,
    @Param("familyId") familyId: string,
  ): Promise<FamilyInviteContract> {
    return this.familyInvitesService.createInvite(context.userId, familyId);
  }

  @Post("family-invites/join")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "使用邀请码立即加入家庭" })
  joinFamily(
    @CurrentUser() context: AuthContext,
    @Body() input: JoinFamilyDto,
  ): Promise<BootstrapContract> {
    return this.familyInvitesService.joinFamily(context.userId, input.code);
  }
}
