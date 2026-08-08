import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { BootstrapModule } from "../bootstrap/bootstrap.module";
import { FamilyInvitesController } from "./family-invites.controller";
import { FamilyInvitesService } from "./family-invites.service";

@Module({
  imports: [AuthModule, BootstrapModule],
  controllers: [FamilyInvitesController],
  providers: [FamilyInvitesService],
})
export class FamilyInvitesModule {}
