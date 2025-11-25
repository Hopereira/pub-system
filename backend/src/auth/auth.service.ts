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
    this.logger.warn(
      ` Falha na autenticação: Email ${email} - Credenciais inválidas`,
    );
    return null;
  }

  async login(user: any) {
    const payload = {
      id: user.id,
      sub: user.id, // Mantém sub para compatibilidade
      email: user.email,
      nome: user.nome,
      cargo: user.cargo,
      role: user.cargo, // Alias para compatibilidade
      empresaId: user.empresaId,
      ambienteId: user.ambienteId,
    };
    const token = this.jwtService.sign(payload);
    this.logger.log(` Token JWT gerado para: ${user.email} (ID: ${user.id})`);
    return {
      access_token: token,
    };
  }
}
