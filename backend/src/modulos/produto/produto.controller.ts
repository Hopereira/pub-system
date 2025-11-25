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
  ParseUUIDPipe,
  Logger,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
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

@ApiTags('Produtos')
@Controller('produtos')
export class ProdutoController {
  private readonly logger = new Logger(ProdutoController.name);

  constructor(private readonly produtoService: ProdutoService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Cria um novo produto com imagem opcional' })
  @ApiResponse({ status: 201, description: 'Produto criado com sucesso.' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado. Apenas Administradores.',
  })
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
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Atualiza um produto (imagem opcional)' })
  @ApiResponse({ status: 200, description: 'Produto atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado.' })
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
    )
    imagemFile?: Express.Multer.File,
  ) {
    // --- MUDANÇA: A lógica de criar a URL foi removida ---
    // Passamos o ID, o DTO e o novo arquivo (se existir) para o serviço.
    return this.produtoService.update(id, updateProdutoDto, imagemFile);
  }

  // Os outros métodos (remove, findAll, findOne) continuam exatamente iguais.
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove um produto' })
  @ApiResponse({ status: 200, description: 'Produto removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.produtoService.remove(id);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista todos os produtos (rota pública)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de produtos retornada com sucesso.',
  })
  findAll() {
    return this.produtoService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Busca um produto por ID' })
  @ApiResponse({ status: 200, description: 'Produto retornado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.produtoService.findOne(id);
  }
}
