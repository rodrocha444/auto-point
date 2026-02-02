import { Field, InputType } from "@nestjs/graphql";
import { IsDateString, IsOptional, IsString } from "class-validator";

@InputType()
export class IntervalDateArgs {
  @Field(() => String, { description: "Formato YYYY-MM-DD" })
  @IsDateString()
  startDate: string;

  @Field(() => String, { description: "Formato YYYY-MM-DD" })
  @IsDateString()
  endDate: string;

  @Field(() => String, {
    defaultValue: process.env.DEFAULT_TIMEZONE ?? "America/Sao_Paulo",
    description: "Timezone IANA (ex: America/Sao_Paulo, UTC...)",
    nullable: true,
  })
  @IsString()
  @IsOptional()
  timezone: string;
}
