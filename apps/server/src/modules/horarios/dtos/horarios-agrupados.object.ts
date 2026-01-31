import { ObjectType, Field } from "@nestjs/graphql";
import { DayOfWeek } from "src/common/enums/day-of-the-week.enum";
import { Horarios } from "../horarios.entity";

@ObjectType()
export class HorariosAgrupados {
  @Field(() => DayOfWeek)
  day: DayOfWeek;

  @Field(() => [Horarios])
  items: Horarios[];
}
