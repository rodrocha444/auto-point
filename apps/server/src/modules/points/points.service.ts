import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { startOfDay, endOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz"; // Removi fromZonedTime pois o Date nativo já resolve
import { Point } from "./points.entity";

@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(Point)
    private pointsRepository: Repository<Point>,
  ) {}

  private getRangeToday() {
    const timezone = process.env.DEFAULT_TIMEZONE || "America/Sao_Paulo";
    const now = new Date();
    const zonedDate = toZonedTime(now, timezone);

    return {
      start: startOfDay(zonedDate),
      end: endOfDay(zonedDate),
      now,
    };
  }

  async hasEvenPointsToday(): Promise<boolean> {
    const { start, end } = this.getRangeToday();

    const count = await this.pointsRepository.count({
      where: { timestamp: Between(start, end) },
    });

    return count % 2 === 0;
  }

  async totalTimeInMsToday(): Promise<number> {
    const { start, end, now } = this.getRangeToday();

    // ADICIONADO: Ordenação ASC é fundamental para o cálculo de pares
    const points = await this.pointsRepository.find({
      where: { timestamp: Between(start, end) },
      order: { timestamp: "ASC" },
    });

    if (points.length === 0) return 0;

    // Se ímpar, simulamos uma saída agora para fechar o cálculo
    const pointsList = [...points];
    if (pointsList.length % 2 !== 0) {
      pointsList.push({
        timestamp: now, // Usar o 'now' puro (UTC) pois o banco armazena em UTC
      } as Point);
    }

    let totalTime = 0;
    for (let i = 0; i < pointsList.length; i += 2) {
      const entry = pointsList[i];
      const exit = pointsList[i + 1];

      if (entry && exit) {
        totalTime += exit.timestamp.getTime() - entry.timestamp.getTime();
      }
    }

    return totalTime;
  }
}
