// Caminho: backend/src/modulos/ambiente/ambiente.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CacheInvalidationService } from '../../cache/cache-invalidation.service';
import { CreateAmbienteDto } from './dto/create-ambiente.dto';
import { UpdateAmbienteDto } from './dto/update-ambiente.dto';
import { Ambiente } from './entities/ambiente.entity';

@Injectable()
export class AmbienteService {
  private readonly logger = new Logger(AmbienteService.name);

  constructor(
    @InjectRepository(Ambiente)
    private readonly ambienteRepository: Repository<Ambiente>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private readonly cacheInvalidationService: CacheInvalidationService,
  ) {}

  async create(createAmbienteDto: CreateAmbienteDto): Promise<Ambiente> {
    const ambiente = this.ambienteRepository.create(createAmbienteDto);
    const savedAmbiente = await this.ambienteRepository.save(ambiente);
    
    // Invalidar cache após criar ambiente (afeta ambientes e produtos)
    await this.cacheInvalidationService.invalidateAmbientes();
    
    return savedAmbiente;
  }

  // --- MÉTODO 'findAll' CORRIGIDO ---
  async findAll(): Promise<any[]> {
    const cacheKey = 'ambientes:all';

    // Tentar buscar do cache
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) {
      this.logger.debug(`🎯 Cache HIT: ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`❌ Cache MISS: ${cacheKey}`);

    const ambientes = await this.ambienteRepository
      .createQueryBuilder('ambiente')
      .leftJoin('ambiente.produtos', 'produto')
      .leftJoin('ambiente.mesas', 'mesa')
      .select('ambiente.id', 'id')
      .addSelect('ambiente.nome', 'nome')
      .addSelect('ambiente.descricao', 'descricao')
      // --- ADICIONADO PARA CORRIGIR O BUG ---
      .addSelect('ambiente.tipo', 'tipo')
      .addSelect('ambiente.isPontoDeRetirada', 'isPontoDeRetirada')
      // --- FIM DA ADIÇÃO ---
      .addSelect('COUNT(DISTINCT produto.id)', 'productCount')
      .addSelect('COUNT(DISTINCT mesa.id)', 'tableCount')
      .groupBy('ambiente.id')
      .orderBy('ambiente.nome', 'ASC')
      .getRawMany();

    // A conversão de `isPontoDeRetirada` para booleano é feita automaticamente pelo driver.
    // O resto da lógica permanece a mesma.
    const result = ambientes.map((ambiente) => ({
      ...ambiente,
      productCount: parseInt(ambiente.productCount, 10),
      tableCount: parseInt(ambiente.tableCount, 10),
    }));

    // Armazenar no cache por 10 minutos (ambientes mudam raramente)
    await this.cacheManager.set(cacheKey, result, 600000);

    return result;
  }
  // --- FIM DA CORREÇÃO ---

  async findOne(id: string): Promise<Ambiente> {
    const ambiente = await this.ambienteRepository.findOne({ where: { id } });
    if (!ambiente) {
      throw new NotFoundException(`Ambiente com ID "${id}" não encontrado.`);
    }
    return ambiente;
  }

  async update(
    id: string,
    updateAmbienteDto: UpdateAmbienteDto,
  ): Promise<Ambiente> {
    const ambiente = await this.ambienteRepository.preload({
      id,
      ...updateAmbienteDto,
    });
    if (!ambiente) {
      throw new NotFoundException(`Ambiente com ID "${id}" não encontrado.`);
    }
    const updatedAmbiente = await this.ambienteRepository.save(ambiente);
    
    // Invalidar cache após atualizar ambiente (afeta ambientes e produtos)
    await this.cacheInvalidationService.invalidateAmbientes();
    
    return updatedAmbiente;
  }

  async remove(id: string): Promise<void> {
    const ambiente = await this.findOne(id);
    try {
      await this.ambienteRepository.remove(ambiente);
      
      // Invalidar cache após remover ambiente (afeta ambientes e produtos)
      await this.cacheInvalidationService.invalidateAmbientes();
    } catch (error) {
      if (error.code === '23503') {
        throw new ConflictException(
          'Este ambiente não pode ser apagado pois está em uso por produtos ou mesas.',
        );
      }
      throw error;
    }
  }
}
