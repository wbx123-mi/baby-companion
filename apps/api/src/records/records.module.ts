import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { RecordsController } from "./records.controller";
import { RecordsService } from "./records.service";
import { MediaModule } from "../media/media.module";

@Module({
  imports: [AuthModule, MediaModule],
  controllers: [RecordsController],
  providers: [RecordsService],
})
export class RecordsModule {}
