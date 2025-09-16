// Caminho: backend/src/modulos/produto/produto.controller.ts
import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards,
  UploadedFile, UseInterceptors, ParseFilePipe, MaxFileSizeValidator,
  FileTypeValidator, ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express'; // Import direto do express
import { ProdutoService } from './produto.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Cargo } from 'src/modulos/funcionario/enums/cargo.enum';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('Produtos / Cardápio')
@Controller('produtos')
export class ProdutoController {
  constructor(private readonly produtoService: ProdutoService) {}

  // --- ROTA UNIFICADA E CORRIGIDA ---
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Cria um novo produto com upload de imagem opcional' })
  @UseInterceptors(FileInterceptor('imagemFile')) // 'imagemFile' deve ser o nome do campo no FormData
  create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5 MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
        ],
        fileIsRequired: false, // Torna o arquivo opcional
      }),
    )
    file: Express.Multer.File,
    @Body() createProdutoDto: CreateProdutoDto,
  ) {
    // Passamos tanto os dados do DTO quanto o arquivo para o serviço
    return this.produtoService.create(createProdutoDto, file);
  }

  // A rota /upload-imagem foi REMOVIDA por ser redundante.

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista todos os produtos do cardápio (Rota Pública)' })
  findAll() {
    return this.produtoService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Busca um produto específico por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.produtoService.findOne(id);
  }

  // A rota PATCH (update) também precisará de uma lógica similar no futuro, mas vamos focar no create primeiro.
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Atualiza os dados de um produto' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProdutoDto: UpdateProdutoDto,
  ) {
    return this.produtoService.update(id, updateProdutoDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Remove um produto do cardápio' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.produtoService.remove(id);
  }
}