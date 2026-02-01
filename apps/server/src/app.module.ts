import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { TypeOrmModule } from "@nestjs/typeorm";
import { join } from "node:path";
import { ScheduleModule } from "@nestjs/schedule";
import { TelegramCronModule } from "./modules/telegram-cron/telegram-cron.module";
import { ConfigModule } from "@nestjs/config";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: "postgres",
      url: process.env.DATABASE_URL,
      entities: [join(__dirname, "**", "*.entity.{ts,js}")],
      synchronize: true,
      logging: true,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "../../schema.gql"),
      sortSchema: true,
      playground: true,
    }),
    ScheduleModule.forRoot(),
    TelegramCronModule,
    UsersModule,
  ],
})
export class AppModule {}
