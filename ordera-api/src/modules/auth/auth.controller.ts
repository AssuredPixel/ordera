import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { OrganizationsService } from '../organizations/organizations.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly orgService: OrganizationsService,
  ) {}


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

  @Public()
  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async forgotPassword(@Body('email') email: string) {
    // Always returns success to prevent email enumeration
    await this.authService.forgotPassword(email).catch(() => {});
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  @Public()
  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async resetPassword(@Body() body: { token: string; password: string }) {
    return this.authService.resetPassword(body.token, body.password);
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
  async me(@GetUser() jwtPayload: any) {
    // Return both the JWT payload fields AND the full organization with subscription
    try {
      if (jwtPayload.organizationId) {
        const organization = await this.orgService.findById(jwtPayload.organizationId.toString());
        return { user: jwtPayload, organization };
      }
    } catch (e) {
      // If org fetch fails, still return user data
    }
    return { user: jwtPayload, organization: null };
  }
}
