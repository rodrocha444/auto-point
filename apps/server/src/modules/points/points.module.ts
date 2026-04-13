import { Module } from "@nestjs/common";
import { Point } from "./points.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PointsResolver } from "./points.resolver";
import { PointsService } from "./points.service";

@Module({
  imports: [TypeOrmModule.forFeature([Point])],
  providers: [PointsResolver, PointsService],
  exports: [PointsService],
})
export class PointsModule {}
