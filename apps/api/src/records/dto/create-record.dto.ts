import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsISO8601, IsOptional, IsString, MaxLength } from "class-validator";

const RECORD_TYPES = ["DAILY", "FIRST", "FAMILY", "OTHER"] as const;

export class CreateRecordDto {
  @ApiProperty()
  @IsString()
  @MaxLength(26)
  babyId!: string;

  @ApiProperty({ enum: RECORD_TYPES })
  @IsIn(RECORD_TYPES)
  type!: (typeof RECORD_TYPES)[number];

  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  content!: string;

  @ApiProperty({ example: "2026-08-08T09:30:00.000Z" })
  @IsISO8601()
  occurredAt!: string;

  @ApiPropertyOptional({ description: "客户端创建幂等键" })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  clientRequestId?: string;
}
