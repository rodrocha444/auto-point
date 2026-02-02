import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { Point } from "./points.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, Repository } from "typeorm";
import { DateArgs } from "src/common/dtos/DateArgs";
import { format, fromZonedTime } from "date-fns-tz";
import { endOfMonth, startOfMonth } from "date-fns";
import { TotalMsInMonthDto } from "./dtos/total-hours-in-mouth.dto";

@Resolver()
export class PointsResolver {
  constructor(
    @InjectRepository(Point)
    private readonly pointRepository: Repository<Point>,
  ) {}

  @Query(() => [Point])
  async pointsByDate(@Args() input: DateArgs): Promise<Point[]> {
    const startString = `${input.date} 00:00:00`;
    const endString = `${input.date} 23:59:59.999`;

    const startUTC = fromZonedTime(startString, input.timezone);
    const endUTC = fromZonedTime(endString, input.timezone);

    return this.pointRepository.find({
      where: {
        timestamp: Between(startUTC, endUTC),
      },
      order: { timestamp: "ASC" },
    });
  }

  @Mutation(() => Point)
  async createPoint(@Args("timestamp") timestamp: Date): Promise<Point> {
    const point = this.pointRepository.create({ timestamp });
    return await this.pointRepository.save(point);
  }

  @Mutation(() => String)
  async deletePoint(@Args("id") id: string): Promise<string> {
    await this.pointRepository.delete(id);
    return id;
  }

  @Query(() => TotalMsInMonthDto)
  async totalMsInMonth(@Args() input: DateArgs): Promise<TotalMsInMonthDto> {
    const startString = `${input.date} 00:00:00`;
    const endString = `${input.date} 23:59:59.999`;

    const monthStart = startOfMonth(new Date(startString));
    const monthEnd = endOfMonth(new Date(endString));

    const points = await this.pointRepository.find({
      where: {
        timestamp: Between(monthStart, monthEnd),
      },
    });

    const gruposPorDia: Record<string, Date[]> = {};

    points.forEach(ponto => {
      // Cria uma chave de data (YYYY-MM-DD)
      // Nota: toISOString usa UTC. Se precisar de fuso local, ajuste aqui.
      const timestampInTimezone = fromZonedTime(
        ponto.timestamp,
        input.timezone,
      );
      const diaKey = format(timestampInTimezone, "MM-dd", {
        timeZone: input.timezone,
      });

      if (!gruposPorDia[diaKey]) {
        gruposPorDia[diaKey] = [];
      }
      gruposPorDia[diaKey].push(ponto.timestamp);
    });

    let invalidDays = 0;
    let milliseconds = 0;

    for (const dia in gruposPorDia) {
      const horarios = gruposPorDia[dia];

      horarios.sort((a, b) => a.getTime() - b.getTime());

      const qtd = horarios.length;

      if (qtd % 2 !== 0) {
        invalidDays++;
        continue;
      }

      for (let i = 0; i < qtd; i += 2) {
        const entrada = horarios[i];
        const saida = horarios[i + 1];
        const diferenca = saida.getTime() - entrada.getTime();
        milliseconds += diferenca;
      }
    }

    return {
      milliseconds,
      invalidDays,
    };
  }
}
