import { Field, InputType } from "@nestjs/graphql";
import { GraphQLLocalTime } from "graphql-scalars";
import { DayOfWeek } from "src/common/enums/day-of-the-week.enum";

@InputType()
export class CreateHorariosInput {
  @Field(() => GraphQLLocalTime)
  time: string;

  @Field(() => DayOfWeek)
  day: DayOfWeek;
}
