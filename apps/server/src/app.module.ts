import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { TypeOrmModule } from "@nestjs/typeorm";
import { join } from "node:path";
import { ScheduleModule } from "@nestjs/schedule";
import { ConfigModule } from "@nestjs/config";
import { PointsModule } from "./modules/points/points.module";

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: "postgres",
      url: process.env.DATABASE_URL,
      entities: [join(__dirname, "**", "*.entity.{ts,js}")],
      logging: process.env.NODE_ENV === "production",
      synchronize: true,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "../../schema.gql"),
      sortSchema: true,
      playground: process.env.NODE_ENV !== "production",
    }),
    ScheduleModule.forRoot(),
    PointsModule,
  ],
})
export class AppModule {}
