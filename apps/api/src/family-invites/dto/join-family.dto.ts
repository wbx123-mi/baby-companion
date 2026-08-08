import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches } from "class-validator";

export class JoinFamilyDto {
  @ApiProperty({ example: "ABCDE-FGHIJ" })
  @IsString()
  @Matches(/^[A-Za-z0-9\s-]{10,16}$/, { message: "邀请码格式不正确" })
  code!: string;
}
