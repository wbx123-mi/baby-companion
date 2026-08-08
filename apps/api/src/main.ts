import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { configureApp } from "./configure-app";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);
  const port = configService.get<number>("API_PORT", 3000);
  const corsOrigin = configService.get<string>("CORS_ORIGIN", "http://localhost:5173");

  configureApp(app, corsOrigin);

  await app.listen(port, "0.0.0.0");
}

void bootstrap();
