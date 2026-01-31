import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { TypeOrmModule } from "@nestjs/typeorm";
import { join } from "node:path";
import { HorariosModule } from "./modules/horarios/horarios.module";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: "localhost",
      port: 5432,
      username: "admin",
      password: "adminpassword",
      database: "autopoint",
      entities: [join(__dirname, "**", "*.entity.{ts,js}")],
      synchronize: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "../../schema.gql"),
      sortSchema: true,
      playground: true,
    }),
    HorariosModule,
  ],
})
export class AppModule {}
