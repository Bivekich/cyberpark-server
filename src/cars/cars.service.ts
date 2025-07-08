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
    return this.carsRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Car> {
    const car = await this.carsRepo.findOne({ where: { id } });
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
    Object.assign(car, dto);
    return this.carsRepo.save(car);
  }

  async remove(id: string): Promise<void> {
    const car = await this.findOne(id);
    await this.carsRepo.remove(car);
  }
} 