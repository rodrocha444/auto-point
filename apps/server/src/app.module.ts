import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { TypeOrmModule } from "@nestjs/typeorm";
import { join } from "node:path";
import { HorariosModule } from "./modules/horarios/horarios.module";
import { ScheduleModule } from "@nestjs/schedule";
import { TelegramCronModule } from "./modules/telegram-cron/telegram-cron.module";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      url: process.env.DATABASE_URL,
      entities: [join(__dirname, "**", "*.entity.{ts,js}")],
      synchronize: true,
      logging: true,
      ssl: {
        rejectUnauthorized: false,
      },
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "../../schema.gql"),
      sortSchema: true,
      playground: true,
    }),
    ScheduleModule.forRoot(),
    HorariosModule,
    TelegramCronModule,
  ],
})
export class AppModule {}
