import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsInt, IsISO8601, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class UpdateBabyDto {
  @ApiProperty() @IsString() @MaxLength(64) nickname!: string;
  @ApiProperty() @IsISO8601({ strict: true }) birthDate!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() birthTime?: string | null;
  @ApiProperty() @IsString() @MaxLength(64) timezone!: string;
  @ApiProperty({ enum: ["MALE", "FEMALE", "UNSPECIFIED"] }) @IsIn(["MALE", "FEMALE", "UNSPECIFIED"]) gender!: "MALE" | "FEMALE" | "UNSPECIFIED";
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) introduction?: string | null;
  @ApiProperty() @IsInt() @Min(1) version!: number;
}
