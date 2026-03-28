import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Ip,
  Headers,
  UseGuards,
  UnauthorizedException,
  Res,
  Req,
} from '@nestjs/common';
import { Response, Request } from 'express';
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
    description: 'Login realizado com sucesso. Retorna access_token e refresh_token.',
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ipAddress: string,
    @Res({ passthrough: true }) res: Response,
    @Headers('user-agent') userAgent?: string,
    @Headers('host') host?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Headers('x-tenant-slug') headerTenantSlug?: string,
  ) {
    // 1. Resolver tenant OBRIGATORIAMENTE antes do login
    const tenantId = await this.authService.resolveTenantFromRequest(host, headerTenantId, headerTenantSlug);

    // 2. Validar credenciais DENTRO do tenant
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.senha,
      tenantId,
      ipAddress,
    );
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 3. Gerar tokens com tenantId obrigatório
    const result = await this.authService.login(user, tenantId, ipAddress, userAgent);

    // 4. Setar refresh_token como httpOnly cookie
    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 5. Remover refresh_token do body retornado
    const { refresh_token, ...publicData } = result;
    return publicData;
  }

  @ThrottleAPI()
  @Post('refresh')
  @ApiOperation({ summary: 'Renovar access token usando refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Access token renovado com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Refresh token inválido ou expirado.' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body('refresh_token') bodyRefreshToken: string,
    @Ip() ipAddress: string,
    @Headers('host') host?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Headers('x-tenant-slug') headerTenantSlug?: string,
  ) {
    const refreshToken = req.cookies?.['refresh_token'] ?? bodyRefreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token nao fornecido');
    }

    // Resolver tenant para validacao cross-tenant
    // Hint explicito (x-tenant-id / x-tenant-slug) deve ser resolvivel — falha propaga (evita bypass)
    // Sem hint explicito (SUPER_ADMIN via localhost/IP) — tenta host, falha silenciosa e ok
    let tenantId: string | undefined;
    if (headerTenantId || headerTenantSlug) {
      tenantId = await this.authService.resolveTenantFromRequest(host, headerTenantId, headerTenantSlug);
    } else {
      try {
        tenantId = await this.authService.resolveTenantFromRequest(host, undefined, undefined);
      } catch {
        tenantId = undefined;
      }
    }

    const result = await this.refreshTokenService.refreshAccessToken(refreshToken, ipAddress, tenantId);

    if (result.refresh_token) {
      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    const { refresh_token, ...publicData } = result;
    return publicData;
  }

  @ThrottleAPI()
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fazer logout e revogar refresh token' })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso.' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: any,
    @Ip() ipAddress: string,
  ) {
    const refreshToken = req.cookies?.['refresh_token'];
    await this.authService.logout(refreshToken, ipAddress, user);
    res.clearCookie('refresh_token', { path: '/auth' });
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
    @Ip() ipAddress: string,
  ) {
    await this.authService.logoutAll(user.sub, ipAddress);
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
}
