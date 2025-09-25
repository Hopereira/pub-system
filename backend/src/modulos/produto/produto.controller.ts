import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards,
<<<<<<< HEAD
  UploadedFile, UseInterceptors, ParseFilePipe, MaxFileSizeValidator,
  FileTypeValidator, ParseUUIDPipe, Logger,
=======
  UploadedFile, UseInterceptors, ParseUUIDPipe, Logger
>>>>>>> d738c0d94244b2141347abcc7b7f1cd9a5c54292
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { diskStorage } from 'multer';
import { ProdutoService } from './produto.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Cargo } from 'src/modulos/funcionario/enums/cargo.enum';
import { Public } from 'src/auth/decorators/public.decorator';

const generateUniqueFilename = (file: Express.Multer.File) => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = file.originalname.split('.').pop();
  return `${timestamp}-${randomStr}.${extension}`;
};

@Controller('produtos')
export class ProdutoController {
  private readonly logger = new Logger(ProdutoController.name);

  constructor(private readonly produtoService: ProdutoService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @UseInterceptors(FileInterceptor('imagemFile', {
    storage: diskStorage({
      destination: './public',
      filename: (req, file, cb) => cb(null, generateUniqueFilename(file)),
    }),
  }))
  create(
<<<<<<< HEAD
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5 MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
        ],
        fileIsRequired: false,
      }),
    )
    imagemFile: Express.Multer.File,
=======
    @UploadedFile() imagemFile: Express.Multer.File,
>>>>>>> d738c0d94244b2141347abcc7b7f1cd9a5c54292
    @Body() createProdutoDto: CreateProdutoDto,
  ) {
    if (imagemFile) {
      const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
<<<<<<< HEAD
      createProdutoDto.urlImagem = `${baseUrl}/${imagemFile.filename}`;
=======
      createProdutoDto.urlImagem = `${baseUrl}/public/${imagemFile.filename}`;
>>>>>>> d738c0d94244b2141347abcc7b7f1cd9a5c54292
      this.logger.log(`URL da imagem gerada: ${createProdutoDto.urlImagem}`);
    }
    return this.produtoService.create(createProdutoDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @UseInterceptors(FileInterceptor('imagemFile', {
    storage: diskStorage({
      destination: './public',
      filename: (req, file, cb) => cb(null, generateUniqueFilename(file)),
    }),
  }))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProdutoDto: UpdateProdutoDto,
<<<<<<< HEAD
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
        ],
        fileIsRequired: false,
      }),
    ) imagemFile?: Express.Multer.File,
  ) {
    if (imagemFile) {
      const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      updateProdutoDto.urlImagem = `${baseUrl}/${imagemFile.filename}`;
=======
    @UploadedFile() imagemFile?: Express.Multer.File,
  ) {
    if (imagemFile) {
      const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      updateProdutoDto.urlImagem = `${baseUrl}/public/${imagemFile.filename}`;
>>>>>>> d738c0d94244b2141347abcc7b7f1cd9a5c54292
      this.logger.log(`Nova URL de imagem gerada para atualização: ${updateProdutoDto.urlImagem}`);
    }
    return this.produtoService.update(id, updateProdutoDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.produtoService.remove(id);
  }
  
  @Public()
  @Get()
  findAll() {
    return this.produtoService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.produtoService.findOne(id);
  }
}