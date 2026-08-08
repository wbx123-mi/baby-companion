import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength } from "class-validator";

export class UpdateFamilyDto {
  @ApiProperty() @IsString() @MaxLength(64) name!: string;
}
