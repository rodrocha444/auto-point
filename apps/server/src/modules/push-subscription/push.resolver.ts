// push.resolver.ts
import { Resolver, Mutation, Args } from "@nestjs/graphql";
import { PushService } from "./push.service";
import { PushSubscription } from "./push-subscription.entity";
import { PushSubscriptionInput } from "./push-subscription.input";
// Importe seu guard de autenticação (ex: @UseGuards(GqlAuthGuard))

@Resolver(() => PushSubscription)
export class PushResolver {
  constructor(private readonly pushService: PushService) {}

  @Mutation(() => PushSubscription)
  // @UseGuards(GqlAuthGuard) -> Garanta que só usuários logados chamem isso
  async savePushSubscription(
    // @CurrentUser() user: User, -> Pegue o ID do usuário logado
    @Args("subscription") subscription: PushSubscriptionInput,
  ) {
    const mockUserId = "123-abc"; // Substitua pelo ID do usuário autenticado
    return this.pushService.saveSubscription(mockUserId, subscription);
  }
}
