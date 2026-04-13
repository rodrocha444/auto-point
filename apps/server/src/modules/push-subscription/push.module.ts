// push.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PushService } from "./push.service";
import { PushResolver } from "./push.resolver";
import { PushSubscription } from "./push-subscription.entity";
import { PushCronService } from "./push-cron.service";

@Module({
  // Importa a entidade para o TypeORM criar o repositório que injetamos no Service
  imports: [TypeOrmModule.forFeature([PushSubscription])],
  providers: [PushResolver, PushService, PushCronService],
  // Exportar o service é uma boa prática caso outro módulo precise disparar notificações no futuro
  exports: [PushService],
})
export class PushModule {}
