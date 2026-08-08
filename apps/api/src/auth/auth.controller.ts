import type { AuthTokensContract, UserContract } from "@baby-companion/contracts";
import { Body, Controller, Get, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { CurrentUser } from "./current-user.decorator";
import { DevLoginDto } from "./dto/dev-login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { WechatLoginDto } from "./dto/wechat-login.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import type { AuthContext } from "../common/request-context";

@ApiTags("auth")
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("auth/wechat/login")
  @ApiOperation({ summary: "使用 wx.login code 登录或注册" })
  loginWithWechat(@Body() input: WechatLoginDto): Promise<AuthTokensContract> {
    return this.authService.loginWithWechat(input.code, input.deviceId);
  }

  @Post("auth/dev-login")
  @ApiOperation({ summary: "开发环境模拟微信身份登录" })
  loginForDevelopment(@Body() input: DevLoginDto): Promise<AuthTokensContract> {
    return this.authService.loginForDevelopment(input);
  }

  @Post("auth/refresh")
  @ApiOperation({ summary: "轮换 Access Token 与 Refresh Token" })
  refresh(@Body() input: RefreshDto): Promise<AuthTokensContract> {
    return this.authService.refresh(input.refreshToken);
  }

  @Post("auth/logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "撤销当前设备会话" })
  logout(@CurrentUser() context: AuthContext): Promise<null> {
    return this.authService.logout(context);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取当前内部用户资料" })
  getMe(@CurrentUser() context: AuthContext): Promise<UserContract> {
    return this.authService.getCurrentUser(context.userId);
  }

  @Put("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "修改当前用户的家庭昵称" })
  updateProfile(
    @CurrentUser() context: AuthContext,
    @Body() input: UpdateProfileDto,
  ): Promise<UserContract> {
    return this.authService.updateNickname(context.userId, input.nickname);
  }
}
