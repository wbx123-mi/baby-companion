import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsIn,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from "class-validator";

export class OnboardingFamilyDto {
  @ApiProperty({ example: "小满的家" })
  @IsString()
  @MaxLength(64)
  name: string;
}

export class OnboardingBabyDto {
  @ApiProperty({ example: "小满" })
  @IsString()
  @MaxLength(64)
  nickname: string;

  @ApiProperty({ example: "2026-07-30" })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  birthDate: string;

  @ApiPropertyOptional({ example: "08:26:00", nullable: true })
  @ValidateIf((_object, value) => value !== null && value !== undefined)
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  birthTime: string | null;

  @ApiProperty({ default: "Asia/Shanghai" })
  @IsIn(["Asia/Shanghai"])
  timezone: string;

  @ApiProperty({ enum: ["MALE", "FEMALE", "UNSPECIFIED"] })
  @IsIn(["MALE", "FEMALE", "UNSPECIFIED"])
  gender: "MALE" | "FEMALE" | "UNSPECIFIED";
}

export class OnboardingDto {
  @ApiProperty({ type: OnboardingFamilyDto })
  @ValidateNested()
  @Type(() => OnboardingFamilyDto)
  family: OnboardingFamilyDto;

  @ApiProperty({ type: OnboardingBabyDto })
  @ValidateNested()
  @Type(() => OnboardingBabyDto)
  baby: OnboardingBabyDto;
}
