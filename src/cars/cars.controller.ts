import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { S3Service } from '../aws/s3.service';
import { RequestUploadDto } from './dto/request-upload.dto';

@Controller('cars')
export class CarsController {
  constructor(
    private readonly carsService: CarsService,
    private readonly s3: S3Service,
  ) {}

  @Get()
  findAll() {
    return this.carsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateCarDto) {
    return this.carsService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.carsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCarDto) {
    return this.carsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.carsService.remove(id);
  }

  @Post('upload-url')
  async getUploadUrl(@Body() dto: RequestUploadDto) {
    const key = `cars/${Date.now()}_${dto.fileName}`;
    const uploadUrl = await this.s3.getUploadUrl(key, dto.contentType);
    const fileUrl = this.s3.getPublicUrl(key);
    return { uploadUrl, fileUrl, key };
  }
} 