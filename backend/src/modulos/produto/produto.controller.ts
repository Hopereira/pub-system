// Caminho: backend/src/modulos/produto/produto.controller.ts
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
  UploadedFile,
  UseInterceptors,
  // --- ADICIONADO: Validadores e o Pipe do NestJS ---
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
} from '@nestjs/common';
import { ProdutoService } from './produto.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Cargo } from 'src/modulos/funcionario/enums/cargo.enum';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
// --- ALTERADO: Usamos o tipo específico do NestJS para compatibilidade com os Pipes ---
import { Express } from 'express';
// --- FIM DAS ALTERAÇÕES ---

@ApiTags('Produtos / Cardápio')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('produtos')
export class ProdutoController {
  constructor(private readonly produtoService: ProdutoService) {}

  @Post()
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Cria um novo produto no cardápio' })
  create(@Body() createProdutoDto: CreateProdutoDto) {
    return this.produtoService.create(createProdutoDto);
  }

  @Post('upload-imagem')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Faz upload da imagem de um produto' })
  @ApiResponse({ status: 201, description: 'URL da imagem retornada com sucesso.' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public',
        filename: (req, file, callback) => {
          // Validação básica de tipo de arquivo aqui também é uma boa prática
          if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
            return callback(
              new BadRequestException('Apenas arquivos de imagem são permitidos!'),
              null,
            );
          }
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
      // Adicionando o limite de tamanho diretamente no multer também
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    }),
  )
  uploadImage(
    // --- ALTERADO: Adicionamos o ParseFilePipe com os validadores ---
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5 MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|gif)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): { url: string } {
    return { url: `${file.filename}` };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista todos os produtos do cardápio (Rota Pública)' })
  @ApiResponse({ status: 200, description: 'Lista de produtos retornada com sucesso.' })
  findAll() {
    return this.produtoService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um produto específico por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.produtoService.findOne(id);
  }

  @Patch(':id')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Atualiza os dados de um produto' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProdutoDto: UpdateProdutoDto,
  ) {
    return this.produtoService.update(id, updateProdutoDto);
  }

  @Delete(':id')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Remove um produto do cardápio' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.produtoService.remove(id);
  }
}