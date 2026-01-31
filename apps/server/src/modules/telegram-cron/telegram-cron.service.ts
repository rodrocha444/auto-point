import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThanOrEqual, Raw, Repository } from "typeorm";
import { Markup, Telegraf } from "telegraf";
import { format } from "date-fns";

import { DayOfWeek } from "src/common/enums/day-of-the-week.enum";
import { Horarios } from "../horarios/horarios.entity";
import { User } from "../users/users.entity";

@Injectable()
export class TelegramCronService implements OnModuleInit {
  private readonly logger = new Logger(TelegramCronService.name);
  private readonly bot: Telegraf;

  constructor(
    @InjectRepository(Horarios)
    private readonly horariosRepo: Repository<Horarios>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    // Dica: Use process.env.TELEGRAM_TOKEN
    this.bot = new Telegraf("8531321844:AAG-2-3LhC-nTMfRUPUcv3AsN55fIaiIQK8");
  }

  onModuleInit() {
    this.setupHandlers();
    void this.bot.launch();
  }

  // --- Handlers do Bot ---

  private setupHandlers() {
    this.bot.start(async ctx => {
      const { id: chatId, first_name: name } = ctx.from;
      await this.userRepo.save({ name, chatId: chatId.toString() });

      await ctx.reply(`Olá ${name}! Notificações ativadas com sucesso! ✅`);
    });

    this.bot.action("confirmar_ponto", async ctx => {
      const agendamento = await this.getProximoAgendamentoPendente();

      if (!agendamento) {
        return ctx.answerCbQuery("Nenhum agendamento pendente encontrado.");
      }

      agendamento.lastPointForHorario = new Date();
      await this.horariosRepo.save(agendamento);

      await ctx.editMessageText("✅ Registro atualizado com sucesso!");
      await ctx.answerCbQuery("Ponto batido!");
    });
  }

  // --- Lógica de Agendamento (Cron) ---

  @Cron(CronExpression.EVERY_5_MINUTES) // Recomendo 1 min para não sobrecarregar
  async handleCron() {
    const agendamento = await this.getProximoAgendamentoPendente();

    if (agendamento) {
      this.logger.log(`Enviando lembrete para horário: ${agendamento.time}`);
      await this.notificarUsuarios();
    }
  }

  private async notificarUsuarios() {
    const users = await this.userRepo.find();

    for (const user of users) {
      try {
        await this.bot.telegram.sendMessage(
          user.chatId,
          `🔔 Já bateu o ponto?`,
          {
            parse_mode: "Markdown",
            ...Markup.inlineKeyboard([
              Markup.button.callback("✅ Confirmar Agora", "confirmar_ponto"),
            ]),
          },
        );
      } catch (e) {
        this.logger.error(`Erro ao enviar para ${user.chatId}`, e);
      }
    }
  }

  // --- Métodos Auxiliares (Helper Functions) ---

  private async getProximoAgendamentoPendente(): Promise<Horarios | null> {
    const agora = new Date();
    const { diaAtual, horaAtual, hojeString } = this.getDataContext(agora);

    return this.horariosRepo.findOne({
      where: {
        day: diaAtual,
        time: LessThanOrEqual(horaAtual),
        lastPointForHorario: Raw(
          alias => `${alias} IS NULL OR DATE(${alias}) < :hoje`,
          { hoje: hojeString },
        ),
      },
      order: { time: "ASC" },
    });
  }

  private getDataContext(data: Date) {
    const dias = Object.values(DayOfWeek); // Garante que pegue a ordem do seu Enum
    return {
      diaAtual: dias[data.getDay()],
      hojeString: format(data, "yyyy-MM-dd"),
      horaAtual: format(data, "HH:mm:ss"),
    };
  }
}
