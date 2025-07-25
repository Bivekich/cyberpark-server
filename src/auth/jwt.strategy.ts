import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    
    const userResponse = { 
      id: user.id, 
      email: user.email, 
      fullName: user.fullName,
      profileImage: user.profileImage,
      selectedLocation: user.selectedLocation,
      selectedLocationId: user.selectedLocationId,
      level: user.level,
      totalSpent: user.totalSpent
    };
    // console.log(`JWT strategy returning user data:`, userResponse);
    
    return userResponse;
  }
}
