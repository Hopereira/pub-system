import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ProdutoService } from './produto.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Cargo } from 'src/modulos/funcionario/enums/cargo.enum';

@UseGuards(JwtAuthGuard, RolesGuard) // Protege TODAS as rotas do controller
@Controller('produtos') // Rota no plural
export class ProdutoController {
  constructor(private readonly produtoService: ProdutoService) {}

  @Post()
  @Roles(Cargo.ADMIN) // Apenas ADMINS podem criar
  create(@Body() createProdutoDto: CreateProdutoDto) {
    return this.produtoService.create(createProdutoDto);
  }

  @Get()
  // Não precisa de @Roles, pois qualquer funcionário logado pode ver
  findAll() {
    return this.produtoService.findAll();
  }

  @Get(':id')
  // Não precisa de @Roles, qualquer funcionário logado pode ver um produto
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    // Usando o ParseUUIDPipe e removendo o "+"
    return this.produtoService.findOne(id);
  }

  @Patch(':id')
  @Roles(Cargo.ADMIN) // Apenas ADMINS podem atualizar
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProdutoDto: UpdateProdutoDto,
  ) {
    return this.produtoService.update(id, updateProdutoDto);
  }

  @Delete(':id')
  @Roles(Cargo.ADMIN) // Apenas ADMINS podem remover
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.produtoService.remove(id);
  }
}