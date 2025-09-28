// backend/src/shared/storage/gcs-storage.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GcsStorageService {
  private storage: Storage;
  private bucket: string;
  private readonly logger = new Logger(GcsStorageService.name);

  constructor(private configService: ConfigService) {
    this.storage = new Storage({
      keyFilename: this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS'),
    });
    this.bucket = this.configService.get<string>('GCS_BUCKET_NAME');
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const bucket = this.storage.bucket(this.bucket);
    // Gera um nome de ficheiro único para evitar sobrepor ficheiros com o mesmo nome
    const blob = bucket.file(Date.now() + '-' + file.originalname.replace(/ /g, '_'));

    return new Promise((resolve, reject) => {
      const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: file.mimetype,
      });

      blobStream.on('error', (err) => {
        this.logger.error('GCS Upload Error:', err);
        reject(`Não foi possível fazer o upload do ficheiro: ${err.message}`);
      });

      blobStream.on('finish', async () => {
        const publicUrl = `https://storage.googleapis.com/${this.bucket}/${blob.name}`;
        
        // await blob.makePublic(); // <--- ESTA É A LINHA QUE FOI REMOVIDA/COMENTADA

        this.logger.log(`Upload bem-sucedido. URL Pública: ${publicUrl}`);
        resolve(publicUrl);
      });

      blobStream.end(file.buffer);
    });
  }

  async deleteFile(publicUrl: string): Promise<void> {
    try {
      // Extrai o nome do ficheiro da URL completa
      const fileName = publicUrl.split(`https://storage.googleapis.com/${this.bucket}/`)[1];
      if (!fileName) {
        this.logger.warn(`URL inválida para exclusão: ${publicUrl}`);
        return;
      }

      await this.storage.bucket(this.bucket).file(fileName).delete();
      this.logger.log(`Ficheiro ${fileName} apagado com sucesso do GCS.`);
    } catch (error) {
      // Não lança um erro se o ficheiro não existir, apenas regista o aviso
      if (error.code === 404) {
        this.logger.warn(`Tentativa de apagar um ficheiro que não existe no GCS: ${publicUrl}`);
      } else {
        this.logger.error(`Falha ao apagar o ficheiro do GCS: ${publicUrl}`, error);
      }
    }
  }
}