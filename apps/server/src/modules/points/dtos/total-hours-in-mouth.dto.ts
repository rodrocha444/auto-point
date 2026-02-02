import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class TotalMsInMonthDto {
  @Field(() => Int)
  milliseconds: number;

  @Field(() => Int)
  invalidDays: number;
}
