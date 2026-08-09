import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsInt, IsString, Max, MaxLength, Min } from "class-validator";

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

  @ApiProperty({ maximum: 10485760 })
  @IsInt()
  @Min(1)
  @Max(10 * 1024 * 1024)
  sizeBytes!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(10000)
  width!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(10000)
  height!: number;
}
