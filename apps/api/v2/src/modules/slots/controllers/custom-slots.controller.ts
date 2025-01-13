import { ApiTags as DocsTags, ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { SlotsService } from "@/modules/slots/services/slots.service";
import { SlotsOutputService } from "@/modules/slots/services/slots-output.service";
import { ApiResponse, GetAvailableSlotsInput } from "@calcom/platform-types";
import { SUCCESS_STATUS } from "@calcom/platform-constants";
import { AvailableSlotsType } from "@calcom/platform-libraries";
import { getAvailableSlots } from "@calcom/platform-libraries";
import { Response as ExpressResponse, Request as ExpressRequest } from "express";
import { Query, Body, Controller, Get, Delete, Post, Req, Res } from "@nestjs/common";

@Controller("/custom/slots")
@DocsTags("Custom Slots")
export class CustomSlotsController {
  constructor(
    private readonly slotsService: SlotsService,
    private readonly slotsOutputService: SlotsOutputService
  ) {}

  @Get("/available")
  @ApiOkResponse({
    description: "Fetch available slots without authentication",
    schema: {
      type: "object",
      properties: {
        status: { type: "string", example: "success" },
        data: {
          type: "object",
          properties: {
            slots: {
              type: "object",
              additionalProperties: {
                type: "array",
                items: {
                  type: "object",
                  oneOf: [
                    {
                      properties: {
                        time: { type: "string", format: "date-time" },
                      },
                    },
                    {
                      properties: {
                        startTime: { type: "string", format: "date-time" },
                        endTime: { type: "string", format: "date-time" },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiOperation({ summary: "Get available slots (public)" })
  async getAvailableSlots(
    @Query() query: GetAvailableSlotsInput,
    @Req() req: ExpressRequest
  ): Promise<ApiResponse<AvailableSlotsType>> {
    // Mocking event type check since no authentication is used
    const isTeamEvent = false; 

    // Fetch available slots
    const availableSlots = await getAvailableSlots({
        input: {
          ...query,
          isTeamEvent,
        },
        ctx: {
          req,
        },
      });

    // Process and format slots for output
    const { slots } = await this.slotsOutputService.getOutputSlots(
      availableSlots,
      query.duration,
      query.eventTypeId,
      query.slotFormat,
      query.timeZone
    );

    return {
      status: SUCCESS_STATUS,
      data: { slots },
    };
  }
}

