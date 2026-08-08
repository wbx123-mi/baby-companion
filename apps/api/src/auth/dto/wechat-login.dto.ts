import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Length, MaxLength } from "class-validator";

export class WechatLoginDto {
  @ApiProperty({ description: "wx.login 返回的一次性临时 code" })
  @IsString()
  @Length(1, 256)
  code: string;

  @ApiPropertyOptional({ description: "客户端生成并持久化的匿名安装 ID" })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  deviceId?: string;
}
