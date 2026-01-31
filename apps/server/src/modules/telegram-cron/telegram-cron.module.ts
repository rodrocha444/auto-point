// telegram-bot.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Horarios } from "../horarios/horarios.entity";
import { User } from "../users/users.entity";
import { TelegramCronService } from "./telegram-cron.service";

@Module({
  imports: [TypeOrmModule.forFeature([Horarios, User])],
  providers: [TelegramCronService],
})
export class TelegramCronModule {}
