import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('auth')
export class AuthController {
  // Triggering recompile
  constructor(private readonly authService: AuthService) {}


  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('google')
  async google(@Body('token') token: string) {
    return this.authService.googleLogin(token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@GetUser('userId') userId: string, @Body('sessionId') sessionId: string) {
    // Session removal handled in UsersService via AuthService
    // return this.authService.logout(userId, sessionId); 
    // Simplified logout for now.
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@GetUser() user: any) {
    return user;
  }
}
