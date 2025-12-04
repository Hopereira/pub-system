import { SetMetadata } from '@nestjs/common';
import { Cargo } from 'src/modulos/funcionario/enums/cargo.enum';

// Esta é a "chave" que vamos usar para associar os cargos a uma rota.
export const ROLES_KEY = 'cargos';

// Este é o nosso novo decorator @Roles() que poderemos usar nos controllers.
export const Roles = (...cargos: Cargo[]) => SetMetadata(ROLES_KEY, cargos);
