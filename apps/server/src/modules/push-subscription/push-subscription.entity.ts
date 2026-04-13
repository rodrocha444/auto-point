// push-subscription.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";
import { ObjectType, Field, ID } from "@nestjs/graphql";

@ObjectType()
@Entity("push_subscriptions")
export class PushSubscription {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  userId: string; // Relacione com sua entidade de Usuário real depois

  @Field()
  @Column({ unique: true }) // O endpoint é único por dispositivo/navegador
  endpoint: string;

  @Field()
  @Column()
  p256dh: string;

  @Field()
  @Column()
  auth: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}
