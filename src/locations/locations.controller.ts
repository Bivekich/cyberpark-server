import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { S3Service } from '../aws/s3.service';
import { RequestUploadDto } from '../cars/dto/request-upload.dto';

@Controller('locations')
export class LocationsController {
  constructor(
    private readonly locationsService: LocationsService,
    private readonly s3: S3Service,
  ) {}

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    if (includeInactive === 'true') {
      return this.locationsService.findAllIncludingInactive();
    }
    return this.locationsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateLocationDto) {
    return this.locationsService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }

  // NEW ENDPOINT: Get cars by location
  @Get(':id/cars')
  findCarsByLocation(@Param('id') locationId: string) {
    return this.locationsService.findCarsByLocation(locationId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLocationDto) {
    return this.locationsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.locationsService.remove(id);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.locationsService.deactivate(id);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.locationsService.activate(id);
  }

  @Post('upload-url')
  async getUploadUrl(@Body() dto: RequestUploadDto) {
    const key = `locations/${Date.now()}_${dto.fileName}`;
    const uploadUrl = await this.s3.getUploadUrl(key, dto.contentType);
    const fileUrl = this.s3.getPublicUrl(key);
    return { uploadUrl, fileUrl, key };
  }
} 