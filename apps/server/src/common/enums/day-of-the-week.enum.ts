import { registerEnumType } from "@nestjs/graphql";

export enum DayOfWeek {
  SUNDAY = "SUNDAY",
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
}

// Isso é OBRIGATÓRIO para o GraphQL reconhecer o Enum
registerEnumType(DayOfWeek, {
  name: "DayOfWeek", // Nome que aparecerá no schema.gql
  description: "Dias da semana de Domingo a Sábado", // Documentação para o playground
});
