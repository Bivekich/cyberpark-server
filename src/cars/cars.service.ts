import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Car, CarStatus } from './car.entity';
import { CarUnit } from './car-unit.entity';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';

@Injectable()
export class CarsService {
  constructor(
    @InjectRepository(Car)
    private readonly carsRepo: Repository<Car>,
  ) {}

  findAll(): Promise<Car[]> {
    return this.carsRepo.find({ 
      relations: ['location'],
      order: { createdAt: 'DESC' } 
    });
  }

  /**
   * Find cars available for a specific user level
   */
  async findAvailableForLevel(userLevel: number): Promise<Car[]> {
    return this.carsRepo.createQueryBuilder('car')
      .leftJoinAndSelect('car.location', 'location')
      .where('car.minLevel <= :userLevel', { userLevel: userLevel >= 1 ? userLevel : 1 })
      .orderBy('car.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Car> {
    const car = await this.carsRepo.findOne({ 
      where: { id },
      relations: ['location']
    });
    if (!car) throw new NotFoundException('Car not found');
    return car;
  }

  async create(dto: CreateCarDto): Promise<Car> {
    const car = this.carsRepo.create(dto);
    const saved = await this.carsRepo.save(car);

    const unitsRepo = this.carsRepo.manager.getRepository(CarUnit);
    const units: Partial<CarUnit>[] = Array.from({ length: dto.quantity }).map(() => ({
      car: saved,
      status: CarStatus.AVAILABLE,
      battery: 100,
      currentUserId: null,
    }));
    await unitsRepo.save(units);
    return saved;
  }

  async update(id: string, dto: UpdateCarDto): Promise<Car> {
    const car = await this.findOne(id);

    // Explicitly handle location change to avoid stale relation data
    if (Object.prototype.hasOwnProperty.call(dto, 'locationId')) {
      car.locationId = dto.locationId ?? null;
      // Clear the relation object so TypeORM picks up the new FK value
      car.location = null as any;
    }

    // Assign the rest of the mutable fields
    Object.assign(car, dto);

    return this.carsRepo.save(car);
  }

  async remove(id: string): Promise<void> {
    const car = await this.findOne(id);
    await this.carsRepo.remove(car);
  }
} 