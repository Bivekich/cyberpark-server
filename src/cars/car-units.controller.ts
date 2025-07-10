import { Controller, Get, Param, Patch, Body, Post, Delete, UseGuards, Request } from '@nestjs/common';
import { CarUnitsService } from './car-units.service';
import { CarStatus } from './car.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('car-units')
export class CarUnitsController {
  constructor(private readonly carUnitsService: CarUnitsService) {}

  @Get('car/:carId')
  findByCar(@Param('carId') carId: string) {
    return this.carUnitsService.findByCar(carId);
  }

  @Get(':unitId')
  findOne(@Param('unitId') unitId: string) {
    return this.carUnitsService.findOne(unitId);
  }

  @Patch(':unitId')
  updateUnit(
    @Param('unitId') unitId: string,
    @Body() body: { status?: CarStatus; battery?: number; currentUserId?: string | null; name?: string; locationId?: string | null },
  ) {
    // Prevent admin from setting RESERVED status (only system can do this)
    if (body.status === CarStatus.RESERVED) {
      throw new Error('RESERVED status can only be set by the system during reservation process');
    }
    return this.carUnitsService.update(unitId, body);
  }

  @Post('car/:carId')
  createUnits(
    @Param('carId') carId: string,
    @Body() body: { quantity: number; locationId?: string },
  ) {
    return this.carUnitsService.createUnits(carId, body.quantity, body.locationId);
  }

  @Delete(':unitId')
  deleteUnit(@Param('unitId') unitId: string) {
    return this.carUnitsService.delete(unitId);
  }

  /**
   * Finish a ride - clears currentUserId and sets car back to available
   */
  @Post('finish-ride')
  @UseGuards(JwtAuthGuard)
  async finishRide(@Request() req: any, @Body() body: { carUnitId?: string }) {
    const userId = req.user.id;
    return this.carUnitsService.finishRide(userId, body.carUnitId);
  }
} 