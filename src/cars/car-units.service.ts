import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarUnit } from './car-unit.entity';
import { Car, CarStatus } from './car.entity';

@Injectable()
export class CarUnitsService {
  constructor(
    @InjectRepository(CarUnit)
    private readonly unitsRepo: Repository<CarUnit>,
    @InjectRepository(Car)
    private readonly carsRepo: Repository<Car>,
  ) {}

  findByCar(carId: string) {
    return this.unitsRepo.find({ where: { carId } });
  }

  async findOne(unitId: string) {
    const unit = await this.unitsRepo.findOne({ where: { id: unitId } });
    if (!unit) throw new NotFoundException('Car unit not found');
    return unit;
  }

  async update(unitId: string, data: { status?: CarStatus; battery?: number; currentUserId?: string | null; name?: string }) {
    const unit = await this.unitsRepo.findOne({ where: { id: unitId } });
    if (!unit) throw new NotFoundException('Unit not found');
    if (data.status) unit.status = data.status;
    if (typeof data.battery === 'number') unit.battery = data.battery;
    if ('currentUserId' in data) unit.currentUserId = data.currentUserId;
    if (data.name !== undefined) unit.name = data.name;
    return this.unitsRepo.save(unit);
  }

  async createUnits(carId: string, quantity: number) {
    // Get the car to use its name for auto-naming units
    const parentCar = await this.carsRepo.findOne({ where: { id: carId } });
    const carName = parentCar?.name || 'Car';
    
    // Get existing units count to continue numbering
    const existingCount = await this.unitsRepo.count({ where: { carId } });
    
    const units: Partial<CarUnit>[] = Array.from({ length: quantity }).map((_, index) => ({
      carId,
      name: `${carName} #${existingCount + index + 1}`,
      status: CarStatus.AVAILABLE,
      battery: 100,
      currentUserId: null,
    }));
    
    // Save the new units
    const savedUnits = await this.unitsRepo.save(units);
    
    // Update the car's quantity
    const car = await this.carsRepo.findOne({ where: { id: carId } });
    if (car) {
      car.quantity += quantity;
      await this.carsRepo.save(car);
    }
    
    return savedUnits;
  }

  async delete(unitId: string) {
    const unit = await this.unitsRepo.findOne({ where: { id: unitId } });
    if (!unit) throw new NotFoundException('Unit not found');
    
    // Update car quantity
    const car = await this.carsRepo.findOne({ where: { id: unit.carId } });
    if (car && car.quantity > 0) {
      car.quantity -= 1;
      await this.carsRepo.save(car);
    }
    
    return this.unitsRepo.remove(unit);
  }

  /**
   * Finish a ride - releases the car unit back to available status
   */
  async finishRide(userId: string, carUnitId?: string): Promise<{ success: boolean; message: string; carUnit?: CarUnit }> {
    try {
      let carUnit: CarUnit | null = null;

      if (carUnitId) {
        // Find specific car unit
        carUnit = await this.unitsRepo.findOne({ where: { id: carUnitId } });
        if (!carUnit) {
          throw new NotFoundException('Car unit not found');
        }
        if (carUnit.currentUserId !== userId) {
          throw new BadRequestException('You are not currently using this car unit');
        }
      } else {
        // Find any car unit currently in use by this user
        carUnit = await this.unitsRepo.findOne({ 
          where: { 
            currentUserId: userId, 
            status: CarStatus.IN_USE 
          } 
        });
        if (!carUnit) {
          throw new BadRequestException('No car unit currently in use by this user');
        }
      }

      // Release the car unit
      carUnit.status = CarStatus.AVAILABLE;
      carUnit.currentUserId = null;
      const updatedUnit = await this.unitsRepo.save(carUnit);

      console.log(`Ride finished: User ${userId} released car unit ${carUnit.id}`);

      return {
        success: true,
        message: 'Ride finished successfully',
        carUnit: updatedUnit
      };
    } catch (error) {
      console.error('Error finishing ride:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to finish ride');
    }
  }
} 