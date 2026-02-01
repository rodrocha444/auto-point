// telegram-bot.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../users/users.entity";
import { TelegramCronService } from "./telegram-cron.service";

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [TelegramCronService],
})
export class TelegramCronModule {}
