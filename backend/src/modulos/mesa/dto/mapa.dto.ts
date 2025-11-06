import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PosicaoDto {
  @ApiProperty({ description: 'Posição X no mapa', example: 100 })
  @IsNumber()
  @Min(0)
  x: number;

  @ApiProperty({ description: 'Posição Y no mapa', example: 200 })
  @IsNumber()
  @Min(0)
  y: number;
}

export class TamanhoDto {
  @ApiProperty({ description: 'Largura em pixels', example: 80 })
  @IsNumber()
  @Min(40)
  @Max(200)
  width: number;

  @ApiProperty({ description: 'Altura em pixels', example: 80 })
  @IsNumber()
  @Min(40)
  @Max(200)
  height: number;
}

export class AtualizarPosicaoMesaDto {
  @ApiProperty({ description: 'Posição da mesa no mapa' })
  @ValidateNested()
  @Type(() => PosicaoDto)
  posicao: PosicaoDto;

  @ApiPropertyOptional({ description: 'Tamanho da mesa' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TamanhoDto)
  tamanho?: TamanhoDto;

  @ApiPropertyOptional({ description: 'Rotação em graus (0, 90, 180, 270)', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(270)
  rotacao?: number;
}

export class MesaMapaDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  numero: number;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  posicao?: PosicaoDto;

  @ApiPropertyOptional()
  tamanho?: TamanhoDto;

  @ApiPropertyOptional()
  rotacao?: number;

  @ApiPropertyOptional()
  comanda?: {
    id: string;
    pedidosProntos: number;
    totalPedidos: number;
  };
}

export class PontoEntregaMapaDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  ativo: boolean;

  @ApiPropertyOptional()
  posicao?: PosicaoDto;

  @ApiPropertyOptional()
  tamanho?: TamanhoDto;

  @ApiPropertyOptional()
  pedidosProntos?: number;
}

export class LayoutEstabelecimentoDto {
  @ApiProperty()
  width: number;

  @ApiProperty()
  height: number;

  @ApiPropertyOptional()
  backgroundImage?: string;

  @ApiPropertyOptional()
  gridSize?: number;
}

export class MapaCompletoDto {
  @ApiProperty({ type: [MesaMapaDto] })
  mesas: MesaMapaDto[];

  @ApiProperty({ type: [PontoEntregaMapaDto] })
  pontosEntrega: PontoEntregaMapaDto[];

  @ApiProperty()
  layout: LayoutEstabelecimentoDto;
}

export class AtualizarLayoutDto {
  @ApiProperty({ description: 'Largura do mapa em pixels', example: 1200 })
  @IsNumber()
  @Min(800)
  @Max(3000)
  width: number;

  @ApiProperty({ description: 'Altura do mapa em pixels', example: 800 })
  @IsNumber()
  @Min(600)
  @Max(2000)
  height: number;

  @ApiPropertyOptional({ description: 'URL da imagem de fundo' })
  @IsOptional()
  backgroundImage?: string;

  @ApiPropertyOptional({ description: 'Tamanho da grade em pixels', example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(50)
  gridSize?: number;
}
