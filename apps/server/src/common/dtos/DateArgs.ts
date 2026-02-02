import { ArgsType, Field } from "@nestjs/graphql";
import { IsDateString, IsOptional, IsString } from "class-validator";

@ArgsType()
export class DateArgs {
  @Field(() => String, { description: "Formato YYYY-MM-DD" })
  @IsDateString()
  date: string;

  @Field(() => String, {
    defaultValue: process.env.DEFAULT_TIMEZONE ?? "America/Sao_Paulo",
    description: "Timezone IANA (ex: America/Sao_Paulo, UTC...)",
    nullable: true,
  })
  @IsString()
  @IsOptional()
  timezone: string;
}
