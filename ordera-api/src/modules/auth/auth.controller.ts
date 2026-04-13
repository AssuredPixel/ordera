import { Controller, Post, Body, Res, Get, UseGuards, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(body.orgSlug, body.salesId, body.password, {
      deviceName: body.deviceName,
      location: body.location
    });
    
    // Set httpOnly cookie
    response.cookie('jwt', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    });

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@GetUser() user: any, @Res({ passthrough: true }) response: Response) {
    await this.authService.logout(user.sub, user.sessionId);
    response.clearCookie('jwt');
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@GetUser() user: any) {
    return this.authService.getMe(user.sub);
  }
}
