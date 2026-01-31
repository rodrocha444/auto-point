import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { User } from "./users.entity";
import { CreateUserInput } from "./dtos/create-user.input";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Resolver()
export class UsersResolver {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Mutation()
  async createUser(@Args("input") input: CreateUserInput): Promise<User> {
    return await this.userRepository.save({
      name: input.username,
      chatid: input.chatid,
    });
  }
}
