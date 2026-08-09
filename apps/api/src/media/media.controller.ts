import { Body, Controller, HttpCode, HttpStatus, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { AuthContext } from "../common/request-context";
import { CreateAvatarUploadIntentDto } from "./dto/create-avatar-upload-intent.dto";
import { CreateUploadIntentDto } from "./dto/create-upload-intent.dto";
import { MediaService } from "./media.service";

@ApiTags("media")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post("upload-intents")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "创建图片直传 MinIO 的临时凭证" })
  createUploadIntent(@CurrentUser() context: AuthContext, @Body() input: CreateUploadIntentDto) {
    return this.mediaService.createUploadIntent(context.userId, input);
  }

  @Post("avatar-upload-intents")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "创建个人或宝宝头像直传 MinIO 的临时凭证" })
  createAvatarUploadIntent(@CurrentUser() context: AuthContext, @Body() input: CreateAvatarUploadIntentDto) {
    return this.mediaService.createAvatarUploadIntent(context.userId, input);
  }

  @Post("avatar-upload-intents/:assetId/complete")
  @ApiOperation({ summary: "确认头像上传并更新个人或宝宝档案" })
  completeAvatarUpload(@CurrentUser() context: AuthContext, @Param("assetId") assetId: string) {
    return this.mediaService.completeAvatarUpload(context.userId, assetId);
  }

  @Post(":assetId/complete")
  @ApiOperation({ summary: "确认图片已上传，并标记为可关联资源" })
  completeUpload(@CurrentUser() context: AuthContext, @Param("assetId") assetId: string) {
    return this.mediaService.completeUpload(context.userId, assetId);
  }
}
