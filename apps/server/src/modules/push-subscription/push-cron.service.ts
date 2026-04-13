// push-cron.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PushService } from "./push.service";

@Injectable()
export class PushCronService {
  private readonly logger = new Logger(PushCronService.name);

  constructor(private readonly pushService: PushService) {}

  // '45 * * * * *' executaria no segundo 45 de cada minuto
  // CronExpression.EVERY_MINUTE é um atalho para '0 * * * * *'
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.debug("Executando envio de notificações automáticas...");

    await this.pushService.sendNotificationToAll(
      "Lembrete Automático",
      `Agora são ${new Date().toLocaleTimeString()} - Não te esqueças de verificar o app!`,
    );
  }
}
