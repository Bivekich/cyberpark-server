import { IsUUID } from 'class-validator';
 
export class CreateReservationDto {
  @IsUUID()
  carId: string;
} 