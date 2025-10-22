import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FuncionarioService } from 'src/modulos/funcionario/funcionario.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private funcionarioService: FuncionarioService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.funcionarioService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.senha))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { senha, ...result } = user;
      this.logger.log(` Autenticação bem-sucedida: ${email} (${user.cargo})`);
      return result;
    }
    this.logger.warn(` Falha na autenticação: Email ${email} - Credenciais inválidas`);
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, cargo: user.cargo };
    const token = this.jwtService.sign(payload);
    this.logger.log(` Token JWT gerado para: ${user.email} (ID: ${user.id})`);
    return {
      access_token: token,
    };
  }
}