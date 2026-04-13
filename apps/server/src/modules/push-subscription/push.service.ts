/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PushSubscription } from "./push-subscription.entity";
import { PushSubscriptionInput } from "./push-subscription.input";
import { Injectable, OnModuleInit } from "@nestjs/common";
import * as webpush from "web-push";

@Injectable()
export class PushService implements OnModuleInit {
  constructor(
    @InjectRepository(PushSubscription)
    private repo: Repository<PushSubscription>,
  ) {}

  async saveSubscription(userId: string, input: PushSubscriptionInput) {
    // Busca se esse dispositivo já está salvo
    let sub = await this.repo.findOne({ where: { endpoint: input.endpoint } });

    if (!sub) {
      sub = this.repo.create({ userId, endpoint: input.endpoint });
    }

    // Atualiza as chaves (elas podem mudar caso o navegador renove a inscrição)
    sub.p256dh = input.keys.p256dh;
    sub.auth = input.keys.auth;

    return await this.repo.save(sub);
  }

  onModuleInit() {
    webpush.setVapidDetails(
      "mailto:exemplo@teudominio.com",
      process.env.PUBLIC_VAPID_KEY!,
      process.env.PRIVATE_VAPID_KEY!,
    );
  }

  async sendNotificationToAll(title: string, body: string) {
    const subscriptions = await this.repo.find();

    const notifications = subscriptions.map(sub => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth,
          p256dh: sub.p256dh,
        },
      };

      return webpush
        .sendNotification(pushConfig, JSON.stringify({ title, body }))
        .catch(err => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Se o token expirou ou é inválido, removemos do banco
            return this.repo.delete(sub.id);
          }
          console.error("Erro ao enviar push:", err);
        });
    });

    await Promise.all(notifications);
  }
}
