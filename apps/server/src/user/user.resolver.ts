import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { User } from "./user.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

@Resolver(() => User)
export class UsersResolver {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  @Query(() => [User])
  async users(): Promise<User[]> {
    return this.usersRepository.find();
  }

  @Mutation(() => User)
  async createUser(@Args("name") name: string, @Args("email") email: string): Promise<User> {
    const user = this.usersRepository.create({ name, email });
    return this.usersRepository.save(user);
  }
}
