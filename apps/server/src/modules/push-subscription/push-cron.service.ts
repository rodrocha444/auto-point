import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PushService } from "./push.service";
import { PointsService } from "../points/points.service";

@Injectable()
export class PushCronService {
  private readonly logger = new Logger(PushCronService.name);

  constructor(
    private readonly pushService: PushService,
    private pointsService: PointsService,
  ) {}

  @Cron("0 */30 20-23 * * *", {
    timeZone: "America/Sao_Paulo",
  })
  async handleLateNightCheck() {
    const hasEvenPoints = await this.pointsService.hasEvenPointsToday();

    if (!hasEvenPoints) {
      this.logger.debug(
        "[Cron 20h+] Verificando ponto ímpar após o horário comercial.",
      );

      await this.pushService.sendNotificationToAll(
        "Ainda por aqui?",
        "Já passou das 20h e seu ponto continua aberto. Não esqueça de bater o ponto de saída!",
      );
    } else {
      this.logger.debug(
        "[Cron 20h+] Usuário com ponto ímpar após o horário comercial.",
      );
      console.log({ hasEvenPoints });
    }
  }

  @Cron("0 0 * * * *", {
    timeZone: "America/Sao_Paulo",
  })
  async handleOvertimeCheck() {
    const _8HOURS_IN_MS = 8 * 60 * 60 * 1000;
    const hasEvenPoints = await this.pointsService.hasEvenPointsToday();
    const totalTimeInMS = await this.pointsService.totalTimeInMsToday();

    if (!hasEvenPoints && totalTimeInMS > _8HOURS_IN_MS) {
      this.logger.debug(
        "[Cron 8h+] Usuário com mais de 8h de trabalho e ponto aberto.",
      );

      await this.pushService.sendNotificationToAll(
        "Jornada Concluída?",
        "Você já completou mais de 8 horas de trabalho hoje. Que tal fechar o ponto?",
      );
    } else {
      this.logger.debug(
        "[Cron 8h+] Usuário com menos de 8h de trabalho ou ponto fechado.",
      );
      console.log({ hasEvenPoints, totalTimeInMS });
    }
  }
}
