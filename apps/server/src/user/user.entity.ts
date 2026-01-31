import { ObjectType, Field, ID } from "@nestjs/graphql"; // GraphQL
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"; // TypeORM

@ObjectType() // <--- Diz pro GraphQL que isso é um Tipo de Retorno
@Entity("users") // <--- Diz pro TypeORM que isso é uma Tabela
export class User {
  @Field(() => ID) // GraphQL
  @PrimaryGeneratedColumn("uuid") // TypeORM
  id: string;

  @Field() // GraphQL (infere String)
  @Column() // TypeORM
  name: string;

  @Field()
  @Column({ unique: true })
  email: string;
}
