import { TypeOrmModule } from "@nestjs/typeorm";
import { Horarios } from "./horarios.entity";
import { Module } from "@nestjs/common";
import { HorariosResolver } from "./horarios.resolver";

@Module({
  imports: [TypeOrmModule.forFeature([Horarios])],
  providers: [HorariosResolver],
})
export class HorariosModule {}
