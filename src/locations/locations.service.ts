import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './location.entity';
import { Car } from '../cars/car.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locationsRepo: Repository<Location>,
    @InjectRepository(Car)
    private readonly carsRepo: Repository<Car>,
  ) {}

  findAll(): Promise<Location[]> {
    return this.locationsRepo.find({ 
      where: { isActive: true },
      order: { createdAt: 'DESC' } 
    });
  }

  findAllIncludingInactive(): Promise<Location[]> {
    return this.locationsRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Location> {
    const location = await this.locationsRepo.findOne({ where: { id } });
    if (!location) {
      throw new NotFoundException('Location not found');
    }
    return location;
  }

  async findCarsByLocation(locationId: string): Promise<Car[]> {
    // First verify the location exists
    await this.findOne(locationId);
    
    // Return cars associated with this location
    return this.carsRepo.find({
      where: { locationId },
      relations: ['location'],
      order: { createdAt: 'DESC' }
    });
  }

  async create(dto: CreateLocationDto): Promise<Location> {
    const location = this.locationsRepo.create(dto);
    return this.locationsRepo.save(location);
  }

  async update(id: string, dto: UpdateLocationDto): Promise<Location> {
    const location = await this.findOne(id);
    Object.assign(location, dto);
    return this.locationsRepo.save(location);
  }

  async remove(id: string): Promise<void> {
    const location = await this.findOne(id);
    await this.locationsRepo.remove(location);
  }

  async deactivate(id: string): Promise<Location> {
    const location = await this.findOne(id);
    location.isActive = false;
    return this.locationsRepo.save(location);
  }

  async activate(id: string): Promise<Location> {
    const location = await this.findOne(id);
    location.isActive = true;
    return this.locationsRepo.save(location);
  }
} 