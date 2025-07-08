import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation, ReservationStatus } from './reservation.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CarUnit } from '../cars/car-unit.entity';
import { CarStatus } from '../cars/car.entity';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private reservationsRepository: Repository<Reservation>,
    @InjectRepository(CarUnit)
    private carUnitsRepository: Repository<CarUnit>,
  ) {}

  private buildExpiration(startTime: Date): Date {
    // 10 minutes TTL
    return new Date(startTime.getTime() + 10 * 60 * 1000);
  }

  async create(userId: string, dto: CreateReservationDto): Promise<Reservation> {
    // Ensure user has no active reservation
    const active = await this.findActiveByUser(userId);
    if (active) {
      throw new BadRequestException('User already has an active reservation');
    }

    // Find an available car unit for the requested car type
    const availableUnit = await this.carUnitsRepository.findOne({
      where: { 
        carId: dto.carId, 
        status: CarStatus.AVAILABLE,
        currentUserId: null
      },
    });

    if (!availableUnit) {
      throw new BadRequestException('No available units for this car type');
    }

    // Reserve the car unit for this user (but not in use yet)
    availableUnit.status = CarStatus.RESERVED;
    availableUnit.currentUserId = userId;
    await this.carUnitsRepository.save(availableUnit);

    const reservation = this.reservationsRepository.create({
      userId,
      carId: dto.carId,
      carUnitId: availableUnit.id,
      startTime: new Date(),
      expiresAt: this.buildExpiration(new Date()),
      status: ReservationStatus.ACTIVE,
    });

    return this.reservationsRepository.save(reservation);
  }

  async findActiveByUser(userId: string): Promise<Reservation | null> {
    const now = new Date();
    let reservation = await this.reservationsRepository.findOne({
      where: { userId, status: ReservationStatus.ACTIVE },
    });

    if (reservation && reservation.expiresAt <= now) {
      // Release the car unit
      if (reservation.carUnitId) {
        const carUnit = await this.carUnitsRepository.findOne({ where: { id: reservation.carUnitId } });
        if (carUnit) {
          carUnit.status = CarStatus.AVAILABLE;
          carUnit.currentUserId = null;
          await this.carUnitsRepository.save(carUnit);
        }
      }

      // Mark expired
      reservation.status = ReservationStatus.EXPIRED;
      await this.reservationsRepository.save(reservation);
      return null;
    }

    return reservation;
  }

  async findAllByUser(userId: string): Promise<Reservation[]> {
    return this.reservationsRepository.find({ where: { userId } });
  }

  async cancel(userId: string, reservationId: string): Promise<void> {
    const reservation = await this.reservationsRepository.findOne({ where: { id: reservationId } });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.userId !== userId) throw new ForbiddenException();
    if (reservation.status !== ReservationStatus.ACTIVE) throw new BadRequestException('Reservation not active');

    // Release the car unit
    if (reservation.carUnitId) {
      const carUnit = await this.carUnitsRepository.findOne({ where: { id: reservation.carUnitId } });
      if (carUnit) {
        carUnit.status = CarStatus.AVAILABLE;
        carUnit.currentUserId = null;
        await this.carUnitsRepository.save(carUnit);
      }
    }

    reservation.status = ReservationStatus.CANCELED;
    await this.reservationsRepository.save(reservation);
  }

  async use(userId: string, reservationId: string): Promise<void> {
    const reservation = await this.reservationsRepository.findOne({ where: { id: reservationId } });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.userId !== userId) throw new ForbiddenException();
    if (reservation.status !== ReservationStatus.ACTIVE) throw new BadRequestException('Reservation not active');

    // Transition car unit from RESERVED to IN_USE
    if (reservation.carUnitId) {
      const carUnit = await this.carUnitsRepository.findOne({ where: { id: reservation.carUnitId } });
      if (carUnit && carUnit.status === CarStatus.RESERVED) {
        carUnit.status = CarStatus.IN_USE;
        await this.carUnitsRepository.save(carUnit);
      }
    }

    reservation.status = ReservationStatus.USED;
    await this.reservationsRepository.save(reservation);

    // Note: Car unit remains IN_USE until ride ends
    // TODO: trigger ride creation here
  }
} 