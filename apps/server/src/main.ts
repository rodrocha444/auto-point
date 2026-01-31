import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SimpleTimestampLogger } from "./utils/SimpleTimestampLogger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new SimpleTimestampLogger(),
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
