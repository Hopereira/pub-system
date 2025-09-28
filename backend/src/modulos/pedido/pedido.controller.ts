import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { PedidoService } from './pedido.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Cargo } from 'src/modulos/funcionario/enums/cargo.enum';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';
import { UpdateItemPedidoStatusDto } from './dto/update-item-pedido-status.dto';

@ApiTags('Pedidos')
@Controller('pedidos')
export class PedidoController {
  constructor(private readonly pedidoService: PedidoService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GARCOM)
  @ApiOperation({ summary: 'Cria um novo pedido (Rota interna para funcionários)' })
  create(@Body() createPedidoDto: CreatePedidoDto) {
    return this.pedidoService.create(createPedidoDto);
  }

  @Public()
  @Post('cliente')
  @ApiOperation({ summary: 'Cria um novo pedido (Fluxo do cliente público)' })
  createFromCliente(@Body() createPedidoDto: CreatePedidoDto) {
    return this.pedidoService.create(createPedidoDto);
  }

  @Patch('/item/:itemPedidoId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.COZINHA, Cargo.GARCOM)
  @ApiOperation({ summary: 'Atualiza o status de um item de pedido específico' })
  updateItemStatus(
    @Param('itemPedidoId', ParseUUIDPipe) itemPedidoId: string,
    @Body() updateItemPedidoStatusDto: UpdateItemPedidoStatusDto,
  ) {
    return this.pedidoService.updateItemStatus(
      itemPedidoId,
      updateItemPedidoStatusDto,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA, Cargo.COZINHA)
  @ApiOperation({ summary: 'Lista todos os pedidos, com filtro opcional por ambiente' })
  findAll(@Query('ambienteId') ambienteId?: string) {
    return this.pedidoService.findAll(ambienteId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA, Cargo.COZINHA)
  @ApiOperation({ summary: 'Busca um pedido específico por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.pedidoService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.COZINHA)
  @ApiOperation({ summary: 'Atualiza dados gerais de um pedido' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePedidoDto: UpdatePedidoDto,
  ) {
    return this.pedidoService.update(id, updatePedidoDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Remove/cancela um pedido (Apenas Administradores)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.pedidoService.remove(id);
  }
}