import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AlterarSenhaDto {
  @ApiProperty({
    description: 'Senha atual do funcionário',
    example: 'senhaAtual123',
  })
  @IsNotEmpty({ message: 'A senha atual é obrigatória.' })
  @IsString()
  senhaAtual: string;

  @ApiProperty({
    description: 'Nova senha do funcionário. Mínimo de 6 caracteres.',
    example: 'novaSenha456',
  })
  @IsNotEmpty({ message: 'A nova senha é obrigatória.' })
  @MinLength(6, { message: 'A nova senha deve ter no mínimo 6 caracteres.' })
  @IsString()
  novaSenha: string;
}
