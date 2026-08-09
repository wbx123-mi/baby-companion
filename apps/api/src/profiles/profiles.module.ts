import { Module } from "@nestjs/common";
import { ProfilesController } from "./profiles.controller";
import { ProfilesService } from "./profiles.service";
import { AuthModule } from "../auth/auth.module";
import { MediaModule } from "../media/media.module";
@Module({ imports: [AuthModule, MediaModule], controllers: [ProfilesController], providers: [ProfilesService] }) export class ProfilesModule {}
