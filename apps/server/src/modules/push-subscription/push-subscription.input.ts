// push-subscription.input.ts
import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class PushSubscriptionKeysInput {
  @Field()
  p256dh: string;

  @Field()
  auth: string;
}

@InputType()
export class PushSubscriptionInput {
  @Field()
  endpoint: string;

  @Field(() => PushSubscriptionKeysInput)
  keys: PushSubscriptionKeysInput;
}
