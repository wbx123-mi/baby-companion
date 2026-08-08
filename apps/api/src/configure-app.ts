import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppExceptionFilter } from "./common/app-exception.filter";
import { ApiResponseInterceptor } from "./common/api-response.interceptor";

export function configureApp(app: INestApplication, corsOrigin: string): void {
  app.setGlobalPrefix("api/v1");
  app.use(helmet());
  app.enableCors({ origin: corsOrigin.split(",").map((origin) => origin.trim()) });
  app.enableShutdownHooks();
  app.useGlobalFilters(new AppExceptionFilter());
  app.useGlobalInterceptors(new ApiResponseInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Baby Companion API")
    .setDescription("家庭私域宝宝成长陪伴小程序 API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, documentFactory, {
    jsonDocumentUrl: "docs/openapi.json",
  });
}
