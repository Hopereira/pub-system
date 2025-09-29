import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { ProdutoService } from './produto.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Cargo } from 'src/modulos/funcionario/enums/cargo.enum';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('produtos')
export class ProdutoController {
  constructor(private readonly produtoService: ProdutoService) {}

  // O método create e update de dados de texto (JSON) continua o mesmo
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  create(@Body() createProdutoDto: CreateProdutoDto) {
    return this.produtoService.create(createProdutoDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateProdutoDto: UpdateProdutoDto) {
    return this.produtoService.update(id, updateProdutoDto);
  }

  // ALTERAÇÃO: Adicionar o endpoint dedicado para o upload
  @Patch(':id/upload-imagem')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @UseInterceptors(FileInterceptor('file')) // A chave 'file' é o que o frontend enviará
  async uploadImagem(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10 MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp|gif)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.produtoService.updateUrlImagem(id, file);
  }

  @Public()
  @Get()
  findAll() {
    return this.produtoService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.produtoService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.produtoService.remove(id);
  }
}