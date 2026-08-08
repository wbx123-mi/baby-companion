import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength } from "class-validator";

export class UpdateProfileDto {
  @ApiProperty({ example: "妈妈", maxLength: 64 })
  @IsString()
  @MaxLength(64)
  nickname!: string;
}
