import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsInt, IsString, Max, MaxLength, Min } from "class-validator";
import { AVATAR_IMAGE_MAX_BYTES, AVATAR_IMAGE_MAX_EDGE } from "../media.constants";

export class CreateAvatarUploadIntentDto {
  @ApiProperty()
  @IsString()
  @MaxLength(26)
  babyId!: string;

  @ApiProperty({ enum: ["USER", "BABY"] })
  @IsIn(["USER", "BABY"])
  target!: "USER" | "BABY";

  @ApiProperty({ example: "image/jpeg" })
  @IsIn(["image/jpeg", "image/png", "image/webp"])
  mimeType!: "image/jpeg" | "image/png" | "image/webp";

  @ApiProperty({ maximum: AVATAR_IMAGE_MAX_BYTES })
  @IsInt()
  @Min(1)
  @Max(AVATAR_IMAGE_MAX_BYTES)
  sizeBytes!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(AVATAR_IMAGE_MAX_EDGE)
  width!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(AVATAR_IMAGE_MAX_EDGE)
  height!: number;
}
