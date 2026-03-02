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
} from '@nestjs/common';
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
    return this.authService.login(user, tenantId, ipAddress, userAgent);
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
    @Body('refresh_token') refreshToken: string,
    @Ip() ipAddress: string,
  ) {
    return this.refreshTokenService.refreshAccessToken(refreshToken, ipAddress);
  }

  @ThrottleAPI()
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fazer logout e revogar refresh token' })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso.' })
  async logout(
    @Body('refresh_token') refreshToken: string,
    @CurrentUser() user: any,
    @Ip() ipAddress: string,
  ) {
    await this.authService.logout(refreshToken, ipAddress, user);
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
