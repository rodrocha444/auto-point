import { Field, Int, ObjectType } from "@nestjs/graphql";
import { Point } from "../points.entity";

@ObjectType()
export class PointsInIntervalWithTotal {
  @Field(() => [Point])
  points: Point[];

  @Field(() => Int)
  milliseconds: number;

  @Field(() => Int)
  invalidDays: number;
}
