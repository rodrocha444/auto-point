import { Module } from "@nestjs/common";
import { Point } from "./points.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PointsResolver } from "./points.resolver";

@Module({
  imports: [TypeOrmModule.forFeature([Point])],
  providers: [PointsResolver],
})
export class PointsModule {}
