import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { TypeOrmModule } from "@nestjs/typeorm";
import { join } from "node:path";
import { UsersModule } from "./user/user.module";

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

    // 2. Configuração do GraphQL ⚛️
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "../../schema.gql"),
      sortSchema: true,
      playground: true,
    }),
    UsersModule,
  ],
})
export class AppModule {}
