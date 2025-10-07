import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards,
  UploadedFile, UseInterceptors, ParseUUIDPipe, Logger, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
// import { diskStorage } from 'multer'; // <-- REMOVIDO
import { ProdutoService } from './produto.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Cargo } from 'src/modulos/funcionario/enums/cargo.enum';
import { Public } from 'src/auth/decorators/public.decorator';

// A função generateUniqueFilename não é mais necessária aqui, pois o GCS cuida disso.

@Controller('produtos')
export class ProdutoController {
  private readonly logger = new Logger(ProdutoController.name);

  constructor(private readonly produtoService: ProdutoService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  // --- MUDANÇA: O FileInterceptor agora é mais simples, sem 'diskStorage' ---
  @UseInterceptors(FileInterceptor('imagemFile'))
  create(
    @UploadedFile(
      // Mantemos a validação do arquivo aqui, é uma boa prática
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5 MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
        ],
        fileIsRequired: false,
      }),
    )
    imagemFile: Express.Multer.File,
    @Body() createProdutoDto: CreateProdutoDto,
  ) {
    // --- MUDANÇA: A lógica de criar a URL foi removida ---
    // Agora, simplesmente passamos o DTO e o arquivo para o serviço.
    return this.produtoService.create(createProdutoDto, imagemFile);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  // --- MUDANÇA: O FileInterceptor também foi simplificado aqui ---
  @UseInterceptors(FileInterceptor('imagemFile'))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProdutoDto: UpdateProdutoDto,
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
    // --- MUDANÇA: A lógica de criar a URL foi removida ---
    // Passamos o ID, o DTO e o novo arquivo (se existir) para o serviço.
    return this.produtoService.update(id, updateProdutoDto, imagemFile);
  }

  // Os outros métodos (remove, findAll, findOne) continuam exatamente iguais.
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