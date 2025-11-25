import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Cargo } from 'src/modulos/funcionario/enums/cargo.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Pega os cargos permitidos da "placa" (@Roles) na rota
    const requiredRoles = this.reflector.getAllAndOverride<Cargo[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Se não há nenhuma placa de cargos, permite o acesso
    if (!requiredRoles) {
      return true;
    }

    // 2. Pega os dados do usuário do "crachá" (token JWT)
    const { user } = context.switchToHttp().getRequest();

    // 3. Verifica se o cargo do usuário está na lista de cargos permitidos
    return requiredRoles.some((role) => user.cargo?.includes(role));
  }
}
