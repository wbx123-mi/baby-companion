import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class DevLoginDto {
  @ApiPropertyOptional({ default: "local-owner", description: "仅开发环境使用的稳定模拟身份" })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  subject?: string;

  @ApiPropertyOptional({ default: "小舅舅" })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  nickname?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  deviceId?: string;
}
