import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { UsersResolver } from "./user.resolver";

@Module({
  imports: [TypeOrmModule.forFeature([User])], // Registra a entidade
  providers: [UsersResolver], // Registra o resolver
})
export class UsersModule {}
