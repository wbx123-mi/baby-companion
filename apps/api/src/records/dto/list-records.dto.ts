import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, Matches, MaxLength } from "class-validator";

const RECORD_TYPES = ["DAILY", "FIRST", "FAMILY", "OTHER"] as const;

export class ListRecordsDto {
  @ApiProperty()
  @IsString()
  @MaxLength(26)
  babyId!: string;

  @IsOptional()
  @IsIn(RECORD_TYPES)
  type?: (typeof RECORD_TYPES)[number];

  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  month?: string;
}
