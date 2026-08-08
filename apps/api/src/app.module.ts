import { type MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RequestIdMiddleware } from "./common/request-id.middleware";
import { AuthModule } from "./auth/auth.module";
import { BootstrapModule } from "./bootstrap/bootstrap.module";
import { OnboardingModule } from "./onboarding/onboarding.module";
import { FamilyInvitesModule } from "./family-invites/family-invites.module";
import { RecordsModule } from "./records/records.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    PrismaModule,
    AuthModule,
    BootstrapModule,
    OnboardingModule,
    FamilyInvitesModule,
    RecordsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
