import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class RefreshDto {
  @ApiProperty({ description: "登录或上次刷新返回的不透明 Refresh Token" })
  @IsString()
  @Length(20, 512)
  refreshToken: string;
}
