import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SimpleTimestampLogger } from "./utils/SimpleTimestampLogger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new SimpleTimestampLogger(),
  });

  app.enableCors({
    origin: process.env.CORS_ORIGIN,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
