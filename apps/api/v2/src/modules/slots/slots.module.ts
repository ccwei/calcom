import { EventTypesModule_2024_04_15 } from "@/ee/event-types/event-types_2024_04_15/event-types.module";
import { PrismaModule } from "@/modules/prisma/prisma.module";
import { CustomSlotsController } from "@/modules/slots/controllers/custom-slots.controller";
import { SlotsController } from "@/modules/slots/controllers/slots.controller";
import { SlotsOutputService } from "@/modules/slots/services/slots-output.service";
import { SlotsService } from "@/modules/slots/services/slots.service";
import { SlotsRepository } from "@/modules/slots/slots.repository";
import { Module } from "@nestjs/common";

@Module({
  imports: [PrismaModule, EventTypesModule_2024_04_15],
  providers: [SlotsRepository, SlotsService, SlotsOutputService],
  controllers: [SlotsController, CustomSlotsController],
  exports: [SlotsService],
})
export class SlotsModule {}