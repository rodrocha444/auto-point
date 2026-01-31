import { Field, ObjectType } from "@nestjs/graphql";
import { GraphQLLocalTime } from "graphql-scalars";
import { DayOfWeek } from "src/common/enums/day-of-the-week.enum";
import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

@ObjectType()
@Entity("horarios")
@Unique(["day", "time"])
export class Horarios {
  @Field(() => String)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field(() => GraphQLLocalTime)
  @Column({ type: "time" })
  time: string;

  @Field(() => DayOfWeek)
  @Column({
    type: "enum",
    enum: DayOfWeek,
  })
  day: DayOfWeek;
}
