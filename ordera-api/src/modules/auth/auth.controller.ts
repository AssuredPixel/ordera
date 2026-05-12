import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('auth')
export class AuthController {
  // Triggering recompile
  constructor(private readonly authService: AuthService) {}


  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(@Body() dto: RegisterDto, @Req() req: any) {
    const result = await this.authService.register(dto);
    this.setCookie(req.res, result.accessToken);
    return result;
  }

  @Post('register-staff')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async registerStaff(@Body() body: { token: string; password: string }, @Req() req: any) {
    const result = await this.authService.registerStaff(body);
    this.setCookie(req.res, result.accessToken);
    return result;
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(@Body() dto: LoginDto, @Req() req: any) {
    const result = await this.authService.login(dto);
    this.setCookie(req.res, result.accessToken);
    return result;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@GetUser() payload: any, @Req() req: any) {
    await this.authService.logout(payload.userId, payload.sessionId);
    req.res.clearCookie('ordera_token');
    return { success: true };
  }

  private setCookie(res: any, token: string) {
    res.cookie('ordera_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@GetUser() user: any) {
    return user;
  }
}
