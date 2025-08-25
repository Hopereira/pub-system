import { PartialType } from '@nestjs/swagger'; // <-- A mudança está aqui
import { CreateProdutoDto } from './create-produto.dto';

export class UpdateProdutoDto extends PartialType(CreateProdutoDto) {}