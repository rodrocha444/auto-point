import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { Horarios } from "./horarios.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateHorariosInput } from "./dtos/create-horarios.input";
import { HorariosAgrupados } from "./dtos/horarios-agrupados.object";
import { NotFoundException } from "@nestjs/common";

@Resolver()
export class HorariosResolver {
  constructor(
    @InjectRepository(Horarios)
    private readonly horariosRepository: Repository<Horarios>,
  ) {}

  @Query(() => [Horarios])
  async horarios(): Promise<Horarios[]> {
    return await this.horariosRepository.find();
  }

  @Mutation(() => Horarios)
  async createHorarios(
    @Args("input") input: CreateHorariosInput,
  ): Promise<Horarios> {
    const horarios = this.horariosRepository.create(input);
    return await this.horariosRepository.save(horarios);
  }

  @Query(() => [HorariosAgrupados])
  async horariosAgrupados(): Promise<HorariosAgrupados[]> {
    const todosHorarios = await this.horariosRepository.find({
      order: { time: "ASC" },
    });

    const agrupado = todosHorarios.reduce(
      (acc, horario) => {
        const dia = horario.day;
        if (!acc[dia]) {
          acc[dia] = { day: dia, items: [] };
        }
        acc[dia].items.push(horario);
        return acc;
      },
      {} as Record<string, HorariosAgrupados>,
    );

    return Object.values(agrupado);
  }

  @Mutation(() => Boolean)
  async deleteHorarios(@Args("id") id: string): Promise<boolean> {
    const horarios = await this.horariosRepository.findOne({ where: { id } });
    if (!horarios)
      throw new NotFoundException(`Horarios with id ${id} not found`);
    await this.horariosRepository.remove(horarios);
    return true;
  }
}
