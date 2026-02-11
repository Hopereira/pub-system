import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Ip,
  Headers,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './refresh-token.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { ThrottleLogin, ThrottleStrict, ThrottleAPI } from '../common/decorators/throttle.decorator';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  @ThrottleLogin()
  @Post('login')
  @ApiOperation({ summary: 'Realiza login e retorna access token e refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso. Retorna access_token. Refresh token via httpOnly cookie.',
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.senha,
      ipAddress,
    );
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const result = await this.authService.login(user, ipAddress, userAgent);

    // Set refresh token as httpOnly cookie (7 days)
    this.setRefreshCookie(res, result.refresh_token);

    return {
      access_token: result.access_token,
      expires_in: result.expires_in,
      tenant_id: result.tenant_id,
      user: result.user,
    };
  }

  @ThrottleAPI()
  @Post('refresh')
  @ApiOperation({ summary: 'Renovar access token usando refresh token (cookie ou body)' })
  @ApiResponse({
    status: 200,
    description: 'Access token renovado com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Refresh token inválido ou expirado.' })
  async refresh(
    @Body('refresh_token') bodyToken: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Ip() ipAddress: string,
  ) {
    // Accept from httpOnly cookie (preferred) or body (backward compat)
    const refreshToken = req.cookies?.refresh_token || bodyToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token não fornecido');
    }

    const result = await this.refreshTokenService.refreshAccessToken(refreshToken, ipAddress);

    // If token was rotated, update cookie
    if (result.refreshToken) {
      this.setRefreshCookie(res, result.refreshToken);
    }

    return {
      access_token: result.accessToken,
      tenant_id: result.tenantId,
    };
  }

  @ThrottleAPI()
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fazer logout e revogar refresh token' })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso.' })
  async logout(
    @Body('refresh_token') bodyToken: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: any,
    @Ip() ipAddress: string,
  ) {
    const refreshToken = req.cookies?.refresh_token || bodyToken;
    if (refreshToken) {
      await this.authService.logout(refreshToken, ipAddress, user);
    }
    this.clearRefreshCookie(res);
    return { message: 'Logout realizado com sucesso' };
  }

  @ThrottleStrict()
  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fazer logout de todas as sessões' })
  @ApiResponse({ status: 200, description: 'Logout de todas as sessões realizado.' })
  async logoutAll(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
    @Ip() ipAddress: string,
  ) {
    await this.authService.logoutAll(user.sub, ipAddress);
    this.clearRefreshCookie(res);
    return { message: 'Logout de todas as sessões realizado com sucesso' };
  }

  @ThrottleAPI()
  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar sessões ativas do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de sessões ativas.' })
  async getSessions(@CurrentUser() user: any) {
    const sessions = await this.refreshTokenService.getUserActiveSessions(
      user.sub,
    );

    return sessions.map((session) => ({
      id: session.id,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isActive: session.isActive,
    }));
  }

  @ThrottleAPI()
  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revogar uma sessão específica' })
  @ApiResponse({ status: 200, description: 'Sessão revogada com sucesso.' })
  async revokeSession(
    @Param('id') sessionId: string,
    @CurrentUser() user: any,
    @Ip() ipAddress: string,
  ) {
    await this.refreshTokenService.revokeSessionById(
      sessionId,
      user.sub,
      ipAddress,
    );
    return { message: 'Sessão revogada com sucesso' };
  }

  private setRefreshCookie(res: Response, token: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private clearRefreshCookie(res: Response): void {
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/auth',
    });
  }
}
