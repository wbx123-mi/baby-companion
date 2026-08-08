import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsIn, IsInt, IsISO8601, IsOptional, IsString, MaxLength, Min } from "class-validator";

const RECORD_TYPES = ["DAILY", "FIRST", "FAMILY", "OTHER"] as const;

export class UpdateRecordDto {
  @ApiProperty({ enum: RECORD_TYPES })
  @IsIn(RECORD_TYPES)
  type!: (typeof RECORD_TYPES)[number];

  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  content!: string;

  @ApiProperty()
  @IsISO8601()
  occurredAt!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  version!: number;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assetIds?: string[];
}
