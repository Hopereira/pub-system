import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

// @Controller('empresa') define que a URL para este atendente começa com /empresa
@Controller('empresa')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  // @Post() diz: "Quando chegar um pedido POST para /empresa, execute este método"
  @Post()
  create(@Body() createEmpresaDto: CreateEmpresaDto) {
    // Pede ao Service para criar a empresa com os dados recebidos
    return this.empresaService.create(createEmpresaDto);
  }

  // @Get() diz: "Quando chegar um pedido GET para /empresa, execute este método"
  @Get()
  find() {
    // Pede ao Service para buscar a empresa
    return this.empresaService.find();
  }

  // @Put(':id') diz: "Quando chegar um pedido PUT para /empresa/ALGUM_ID, execute este método"
  @Put(':id')
  update(
    // Pega o ID da URL e os dados do corpo da requisição
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEmpresaDto: UpdateEmpresaDto,
  ) {
    // Pede ao Service para atualizar a empresa
    return this.empresaService.update(id, updateEmpresaDto);
  }
}