import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsInt, IsString, Max, MaxLength, Min } from "class-validator";
import { RECORD_IMAGE_MAX_BYTES, RECORD_IMAGE_MAX_EDGE } from "../media.constants";

export class CreateUploadIntentDto {
  @ApiProperty()
  @IsString()
  @MaxLength(26)
  babyId!: string;

  @ApiProperty({ example: "image/jpeg" })
  @IsIn(["image/jpeg", "image/png", "image/webp"])
  mimeType!: "image/jpeg" | "image/png" | "image/webp";

  @ApiProperty({ maximum: RECORD_IMAGE_MAX_BYTES })
  @IsInt()
  @Min(1)
  @Max(RECORD_IMAGE_MAX_BYTES)
  sizeBytes!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(RECORD_IMAGE_MAX_EDGE)
  width!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(RECORD_IMAGE_MAX_EDGE)
  height!: number;
}
