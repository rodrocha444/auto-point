import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Telegraf } from "telegraf";

import { User } from "../users/users.entity";

@Injectable()
export class TelegramCronService implements OnModuleInit {
  private readonly logger = new Logger(TelegramCronService.name);
  private readonly bot: Telegraf;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    if (!process.env.TELEGRAM_TOKEN_BOT)
      throw new Error("TELEGRAM_TOKEN_BOT not found");
    this.bot = new Telegraf(process.env.TELEGRAM_TOKEN_BOT);
  }

  onModuleInit() {
    this.setupHandlers();
    void this.bot.launch();
  }

  private setupHandlers() {
    this.bot.start(async ctx => {
      const { id: chatId, first_name: name } = ctx.from;
      await this.userRepo.save({ name, chatId: chatId.toString() });

      await ctx.reply(`Olá ${name}! Notificações ativadas com sucesso! ✅`);
    });
  }
}
