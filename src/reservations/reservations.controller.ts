import { Controller, Post, Body, UseGuards, Req, Get, Param, NotFoundException, Headers, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Controller('reservations')
export class ReservationsController {
  constructor(private reservationsService: ReservationsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req: any, @Body() dto: CreateReservationDto) {
    return this.reservationsService.create(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('active')
  getActive(@Request() req: any) {
    return this.reservationsService.findActiveByUser(req.user.id).then((res) => {
      if (!res) {
        throw new NotFoundException();
      }
      return res;
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req: any) {
    return this.reservationsService.findAllByUser(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  cancel(@Request() req: any, @Param('id') id: string) {
    return this.reservationsService.cancel(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/use')
  use(@Request() req: any, @Param('id') id: string) {
    return this.reservationsService.use(req.user.id, id);
  }
} 